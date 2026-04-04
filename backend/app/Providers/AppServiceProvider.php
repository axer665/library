<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Подтвердите адрес электронной почты')
                ->line('Нажмите кнопку ниже, чтобы подтвердить email и завершить регистрацию.')
                ->action('Подтвердить email', $url)
                ->line('Если вы не создавали аккаунт, ничего делать не нужно.');
        });
    }
}
