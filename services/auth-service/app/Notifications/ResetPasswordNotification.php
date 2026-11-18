<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email with the link to choose a new password (US-24).
 */
final class ResetPasswordNotification extends Notification
{
    public function __construct(
        public readonly string $url,
        public readonly int $ttlMinutes,
    ) {}

    /**
     * @return list<string>
     */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('mail.reset.subject'))
            ->greeting(__('mail.reset.greeting', ['name' => $notifiable->name]))
            ->line(__('mail.reset.intro'))
            ->action(__('mail.reset.action'), $this->url)
            ->line(__('mail.reset.expiry', ['minutes' => $this->ttlMinutes]))
            ->line(__('mail.reset.ignore'))
            ->salutation(__('mail.salutation'));
    }
}
