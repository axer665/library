<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendRegistrationVerificationJob;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        SendRegistrationVerificationJob::dispatch($user->id);

        $token = auth('api')->login($user);

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! $token = auth('api')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль.'],
            ]);
        }

        return response()->json([
            'user' => auth('api')->user(),
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json(['message' => 'Успешно вышли из системы']);
    }

    public function me(): JsonResponse
    {
        return response()->json(auth('api')->user());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = auth('api')->user();
        $user->name = $data['name'];
        $user->save();

        return response()->json($user);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = auth('api')->user();

        if (! Hash::check($data['current_password'], $user->getAuthPassword())) {
            throw ValidationException::withMessages([
                'current_password' => ['Неверный текущий пароль.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        return response()->json(['message' => 'Пароль обновлён.']);
    }

    public function refresh(Request $request): JsonResponse
    {
        try {
            if (! $request->bearerToken()) {
                return response()->json(['message' => 'Token required'], 401);
            }

            $newToken = auth('api')->setToken($request->bearerToken())->refresh();

            return response()->json([
                'access_token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Unable to refresh token'], 401);
        }
    }

    /**
     * Подписанная ссылка из письма; ведёт на API, затем редирект на SPA.
     */
    public function verifyEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Неверная или устаревшая ссылка подтверждения.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->away($this->frontendSuccessUrl());
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect()->away($this->frontendSuccessUrl());
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Адрес email уже подтверждён.']);
        }

        SendRegistrationVerificationJob::dispatch($user->id);

        return response()->json(['message' => 'Мы отправили письмо со ссылкой ещё раз.']);
    }

    private function frontendSuccessUrl(): string
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return $base.'/?email_verified=1';
    }
}
