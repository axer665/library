<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedbackSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FeedbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

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

        FeedbackSubmission::create([
            'email' => $email,
            'name' => $validated['name'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Спасибо, сообщение отправлено.',
        ], 201);
    }
}
