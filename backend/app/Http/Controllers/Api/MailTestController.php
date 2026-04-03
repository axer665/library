<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailTestController extends Controller
{
    /**
     * Отправка тестового письма на email текущего пользователя (проверка SMTP).
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            Mail::raw(
                "Это тестовое письмо из приложения «Мой Книжный Каталог».\n\nВремя сервера: ".now()->toDateTimeString(),
                function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Тест почты: Мой Книжный Каталог');
                }
            );
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Не удалось отправить письмо: '.$e->getMessage(),
            ], 502);
        }

        return response()->json([
            'message' => 'Письмо отправлено на '.$user->email,
        ]);
    }
}
