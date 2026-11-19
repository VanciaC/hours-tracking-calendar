<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RegistrationMode;
use App\Enums\Role;
use App\Exceptions\EmailAlreadyRegisteredException;
use App\Exceptions\ForbiddenException;
use App\Exceptions\InvalidInvitationException;
use App\Exceptions\RegistrationDisabledException;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationNotification;
use App\Repositories\Contracts\InvitationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Tenancy\FrontendUrl;
use Carbon\CarbonImmutable;
use Illuminate\Config\Repository as ConfigRepository;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Enumerable;

/**
 * Invitations to the current company, the only way to sign up in invite mode (US-33).
 *
 * Settings are read when used, not in the constructor: Lighthouse keeps resolver
 * instances, so a value read once would never change afterwards.
 */
final class InvitationService
{
    public function __construct(
        private readonly InvitationRepositoryInterface $invitationRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly ConnectionInterface $db,
        private readonly ConfigRepository $config,
        private readonly FrontendUrl $frontendUrl,
    ) {}

    public function mode(): RegistrationMode
    {
        return RegistrationMode::fromConfig($this->config->string('registration.mode', 'invite'));
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
     * An admin invites an address. The account created from it is a regular user.
     *
     * @throws ForbiddenException when the requester is not an admin
     * @throws RegistrationDisabledException when sign-up is closed
     * @throws EmailAlreadyRegisteredException when the address already has an account in this company
     */
    public function invite(User $requester, string $email): Invitation
    {
        $this->ensureAdmin($requester);

        return $this->createAndSend($email, Role::User, $requester->id, $requester->name, $this->localeOf($requester));
    }

    /**
     * The server invites the first admin of a company (tenant:create). The account created
     * from it gets the admin role: still only given from the server (RG-13).
     *
     * @throws RegistrationDisabledException when sign-up is closed
     * @throws EmailAlreadyRegisteredException when the address already has an account in this company
     */
    public function inviteFirstAdmin(string $email, string $inviterName, string $locale): Invitation
    {
        return $this->createAndSend($email, Role::Admin, null, $inviterName, $locale);
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
            $this->send($invitation, $plainToken, $requester->name, $this->localeOf($requester));
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
     * The invitation behind an emailed link, null when unknown, accepted, expired or from another company.
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

    private function createAndSend(
        string $email,
        Role $role,
        ?int $invitedBy,
        string $inviterName,
        ?string $locale,
    ): Invitation {
        $this->ensureNotClosed();

        $email = mb_strtolower(trim($email));

        // Limited to the current company by the tenant scope of the User model.
        if ($this->userRepository->findByEmail($email) !== null) {
            throw new EmailAlreadyRegisteredException;
        }

        // If the email cannot be sent, no invitation is left behind and the admin can try again.
        return $this->db->transaction(function () use ($email, $role, $invitedBy, $inviterName, $locale): Invitation {
            $this->invitationRepository->deleteForEmail($email);

            $plainToken = $this->newToken();
            $invitation = $this->invitationRepository->create(
                $email,
                $this->hash($plainToken),
                $invitedBy,
                $this->expiry(),
                $role,
            );

            $this->send($invitation, $plainToken, $inviterName, $locale);

            return $invitation;
        });
    }

    /**
     * The link opens the sign-up page of the current company.
     * The email is in the inviter's language: the invited person has none yet.
     */
    private function send(Invitation $invitation, string $plainToken, string $inviterName, ?string $locale): void
    {
        $url = $this->frontendUrl->to('/inscription', ['invitation' => $plainToken]);

        $notification = (new InvitationNotification($url, $this->ttlDays(), $inviterName))->locale($locale);

        (new AnonymousNotifiable)->route('mail', $invitation->email)->notify($notification);
    }

    /**
     * Null lets Laravel use the application's default language.
     */
    private function localeOf(User $user): ?string
    {
        $locale = $user->getAttribute('locale');

        return is_string($locale) ? $locale : null;
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

    private function ttlDays(): int
    {
        return $this->config->integer('registration.invitation_ttl_days', 7);
    }

    private function expiry(): CarbonImmutable
    {
        return CarbonImmutable::now()->addDays($this->ttlDays());
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
