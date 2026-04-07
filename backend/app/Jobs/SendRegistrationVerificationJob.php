<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendRegistrationVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 120];

    public function __construct(public int $userId)
    {
        $this->onQueue('registration');
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);

        if ($user === null || $user->hasVerifiedEmail()) {
            return;
        }

        $user->sendEmailVerificationNotification();
    }
}
