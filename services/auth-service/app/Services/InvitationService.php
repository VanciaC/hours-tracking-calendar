<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RegistrationMode;
use App\Exceptions\EmailAlreadyRegisteredException;
use App\Exceptions\ForbiddenException;
use App\Exceptions\InvalidInvitationException;
use App\Exceptions\RegistrationDisabledException;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationNotification;
use App\Repositories\Contracts\InvitationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Enumerable;

/**
 * Invitations sent by admins, the only way to sign up in invite mode (US-33).
 */
final class InvitationService
{
    public function __construct(
        private readonly InvitationRepositoryInterface $invitationRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly ConnectionInterface $db,
        #[Config('registration.mode')]
        private readonly string $mode,
        #[Config('registration.invitation_ttl_days')]
        private readonly int $ttlDays,
        #[Config('registration.frontend_url')]
        private readonly string $frontendUrl,
    ) {}

    public function mode(): RegistrationMode
    {
        return RegistrationMode::fromConfig($this->mode);
    }

    /**
     * @return Enumerable<int, Invitation>
     *
     * @throws ForbiddenException when the requester is not an admin
     */
    public function list(User $requester): Enumerable
    {
        $this->ensureAdmin($requester);

        return $this->invitationRepository->findAllLatestFirst();
    }

    /**
     * Invites an address and emails it the sign-up link. Replaces any previous invitation to that address.
     *
     * @throws ForbiddenException when the requester is not an admin
     * @throws RegistrationDisabledException when sign-up is closed
     * @throws EmailAlreadyRegisteredException when the address already has an account
     */
    public function invite(User $requester, string $email): Invitation
    {
        $this->ensureAdmin($requester);
        $this->ensureNotClosed();

        $email = mb_strtolower(trim($email));

        if ($this->userRepository->findByEmail($email) !== null) {
            throw new EmailAlreadyRegisteredException;
        }

        // If the email cannot be sent, no invitation is left behind and the admin can try again.
        return $this->db->transaction(function () use ($requester, $email): Invitation {
            $this->invitationRepository->deleteForEmail($email);

            $plainToken = $this->newToken();
            $invitation = $this->invitationRepository->create(
                $email,
                $this->hash($plainToken),
                $requester->id,
                $this->expiry(),
            );

            $this->send($invitation, $plainToken, $requester);

            return $invitation;
        });
    }

    /**
     * Sends a new link, valid for the full lifetime again. The previous link stops working.
     *
     * @throws ForbiddenException when the requester is not an admin
     * @throws RegistrationDisabledException when sign-up is closed
     * @throws InvalidInvitationException when the invitation is unknown or already accepted
     */
    public function resend(User $requester, int $id): Invitation
    {
        $this->ensureAdmin($requester);
        $this->ensureNotClosed();

        $invitation = $this->invitationRepository->findById($id);

        if ($invitation === null || $invitation->accepted_at !== null) {
            throw new InvalidInvitationException;
        }

        $this->db->transaction(function () use ($invitation, $requester): void {
            $plainToken = $this->newToken();
            $this->invitationRepository->renew($invitation, $this->hash($plainToken), $this->expiry());
            $this->send($invitation, $plainToken, $requester);
        });

        return $invitation;
    }

    /**
     * Cancels an invitation that was not accepted yet. False when there was nothing to cancel.
     *
     * @throws ForbiddenException when the requester is not an admin
     */
    public function revoke(User $requester, int $id): bool
    {
        $this->ensureAdmin($requester);

        $invitation = $this->invitationRepository->findById($id);

        if ($invitation === null || $invitation->accepted_at !== null) {
            return false;
        }

        $this->invitationRepository->delete($invitation);

        return true;
    }

    /**
     * The invitation behind an emailed link, null when unknown, accepted or expired.
     */
    public function findPending(string $plainToken): ?Invitation
    {
        $invitation = $this->invitationRepository->findByHash($this->hash($plainToken));

        return $invitation !== null && $invitation->isPending() ? $invitation : null;
    }

    public function markAccepted(Invitation $invitation): void
    {
        $this->invitationRepository->markAccepted($invitation);
    }

    private function send(Invitation $invitation, string $plainToken, User $inviter): void
    {
        $url = rtrim($this->frontendUrl, '/').'/inscription?invitation='.$plainToken;

        // The invited person has no account, so no language yet: the email uses the admin's.
        $notification = (new InvitationNotification($url, $this->ttlDays, $inviter->name))
            ->locale($inviter->preferredLocale());

        (new AnonymousNotifiable)->route('mail', $invitation->email)->notify($notification);
    }

    private function ensureAdmin(User $requester): void
    {
        if (! $requester->isAdmin()) {
            throw new ForbiddenException;
        }
    }

    private function ensureNotClosed(): void
    {
        if ($this->mode() === RegistrationMode::Closed) {
            throw new RegistrationDisabledException;
        }
    }

    private function expiry(): CarbonImmutable
    {
        return CarbonImmutable::now()->addDays($this->ttlDays);
    }

    /**
     * 32 random bytes, 64 hex characters: impossible to guess. Only its hash is stored.
     */
    private function newToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    private function hash(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
