<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
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

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $base = rtrim((string) config('app.frontend_url'), '/');
            $url = $base.'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);

            $minutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

            return (new MailMessage)
                ->subject('Сброс пароля')
                ->line('Вы получили это письмо, потому что для вашего аккаунта запрошена смена пароля.')
                ->action('Задать новый пароль', $url)
                ->line("Ссылка действует {$minutes} минут.")
                ->line('Если вы не запрашивали сброс, ничего делать не нужно.');
        });
    }
}
