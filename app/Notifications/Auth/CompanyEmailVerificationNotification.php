<?php

namespace App\Notifications\Auth;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CompanyEmailVerificationNotification extends VerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }

    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirme seu e-mail — Minha Fonte')
            ->greeting('Olá, ' . $notifiable->fantasy_name . '!')
            ->line('Clique no botão abaixo para confirmar seu endereço de e-mail.')
            ->action('Confirmar e-mail', $url)
            ->line('O link expira em 60 minutos.')
            ->line('Se você não criou uma conta, ignore este e-mail.');
    }
}