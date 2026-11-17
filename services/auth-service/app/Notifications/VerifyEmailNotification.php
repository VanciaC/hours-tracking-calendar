<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email sent after sign-up, with the link that verifies the address (US-22).
 */
final class VerifyEmailNotification extends Notification
{
    public function __construct(
        public readonly string $url,
        public readonly int $ttlHours,
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
            ->subject(__('mail.verify.subject'))
            ->greeting(__('mail.verify.greeting', ['name' => $notifiable->name]))
            ->line(__('mail.verify.intro'))
            ->action(__('mail.verify.action'), $this->url)
            ->line(__('mail.verify.expiry', ['hours' => $this->ttlHours]))
            ->line(__('mail.verify.ignore'))
            ->salutation(__('mail.salutation'));
    }
}
