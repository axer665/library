<?php

namespace App\Jobs;

use App\Mail\FeedbackAcknowledgementMailable;
use App\Models\FeedbackSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendFeedbackAcknowledgementJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Одна попытка: при ошибке доставки помечаем заявку и не дублируем письма. */
    public int $tries = 1;

    public int $timeout = 120;

    public function __construct(public int $feedbackSubmissionId)
    {
        $this->onQueue('feedback');
    }

    public function handle(): void
    {
        $submission = FeedbackSubmission::query()->find($this->feedbackSubmissionId);

        if ($submission === null) {
            return;
        }

        if ($submission->delivery_status !== FeedbackSubmission::DELIVERY_PENDING) {
            return;
        }

        try {
            Mail::to($submission->email)->send(new FeedbackAcknowledgementMailable($submission));
            $submission->update(['delivery_status' => FeedbackSubmission::DELIVERY_DELIVERED]);
        } catch (Throwable $e) {
            Log::warning('feedback.ack_mail_failed', [
                'submission_id' => $submission->id,
                'email' => $submission->email,
                'message' => $e->getMessage(),
            ]);
            $submission->update(['delivery_status' => FeedbackSubmission::DELIVERY_FAILED]);
        }
    }
}
