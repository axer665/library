<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordResetController extends Controller
{
    /**
     * Отправка письма со ссылкой. Ответ одинаковый при неизвестном email (без перечисления аккаунтов).
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        try {
            Password::sendResetLink($request->only('email'));
        } catch (Throwable $e) {
            Log::error('Forgot password: send reset link failed', [
                'email' => $request->input('email'),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Сейчас не удалось отправить письмо. Попробуйте позже. Если ошибка повторяется, проверьте логи сервера и настройки SMTP (MAIL_*) в .env.',
            ], 503);
        }

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
