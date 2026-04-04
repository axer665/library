<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Отправка письма со ссылкой. Ответ одинаковый при неизвестном email (без перечисления аккаунтов).
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'Если указанный email зарегистрирован, мы отправили письмо со ссылкой для сброса пароля.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            $message = match ($status) {
                Password::INVALID_TOKEN, Password::INVALID_USER => 'Ссылка недействительна или устарела. Запросите новое письмо.',
                Password::RESET_THROTTLED => 'Слишком много попыток. Подождите минуту и попробуйте снова.',
                default => 'Не удалось сменить пароль.',
            };

            throw ValidationException::withMessages([
                'email' => [$message],
            ]);
        }

        return response()->json([
            'message' => 'Пароль обновлён. Теперь можно войти.',
        ]);
    }
}
