<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email sent to an invited person, with the link to create their account (US-33).
 * Sent to an address, not a user: the account does not exist yet.
 */
final class InvitationNotification extends Notification
{
    public function __construct(
        public readonly string $url,
        public readonly int $ttlDays,
        public readonly string $inviterName,
    ) {}

    /**
     * @return list<string>
     */
    public function via(AnonymousNotifiable $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(AnonymousNotifiable $notifiable): MailMessage
    {
        return (new MailMessage)
            // The sender's name in the recipient's language: "Mes heures" in French.
            ->from((string) config('mail.from.address'), __('mail.app_name'))
            ->subject(__('mail.invite.subject'))
            ->greeting(__('mail.invite.greeting'))
            ->line(__('mail.invite.intro', ['inviter' => $this->inviterName]))
            ->action(__('mail.invite.action'), $this->url)
            ->line(__('mail.invite.expiry', ['days' => $this->ttlDays]))
            ->line(__('mail.invite.ignore'))
            ->salutation(__('mail.salutation'));
    }
}
