<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendFeedbackAcknowledgementJob;
use App\Models\FeedbackSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FeedbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(
            [
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    function (string $attribute, mixed $value, \Closure $fail): void {
                        if (! is_string($value)) {
                            return;
                        }
                        $domain = Str::after(Str::lower(trim($value)), '@');
                        if ($domain === '' || str_contains($domain, ' ')) {
                            return;
                        }
                        // Проверка, что у домена есть MX или A (принимает почту). Не гарантирует существование ящика.
                        if (! checkdnsrr($domain, 'MX') && ! checkdnsrr($domain, 'A')) {
                            $fail('Домен в адресе не найден или не принимает почту. Проверьте написание.');
                        }
                    },
                ],
                'name' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ],
            [
                'email.required' => 'Укажите email.',
                'email.email' => 'Укажите корректный email.',
            ]
        );

        $email = Str::lower(trim($validated['email']));

        $alreadyToday = FeedbackSubmission::query()
            ->where('email', $email)
            ->where('created_at', '>=', now()->startOfDay())
            ->exists();

        if ($alreadyToday) {
            return response()->json([
                'message' => 'С этого адреса уже отправлено сообщение сегодня. Попробуйте завтра.',
            ], 422);
        }

        $submission = FeedbackSubmission::create([
            'email' => $email,
            'name' => $validated['name'],
            'message' => $validated['message'],
            'delivery_status' => FeedbackSubmission::DELIVERY_PENDING,
        ]);

        SendFeedbackAcknowledgementJob::dispatch($submission->id);

        return response()->json([
            'message' => 'Спасибо, сообщение отправлено.',
        ], 201);
    }
}
