<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RegistrationMode;
use App\Exceptions\InvalidInvitationException;
use App\Exceptions\InvalidVerificationTokenException;
use App\Exceptions\InvitationRequiredException;
use App\Exceptions\RegistrationDisabledException;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Repositories\Contracts\EmailVerificationTokenRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiter;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\ConnectionInterface;

/**
 * Sign-up and email verification use cases (US-03, US-22, US-23, US-33).
 */
final class RegistrationService
{
    /** Verification emails that can be resent per address, per hour (US-23). */
    private const MAX_RESENDS_PER_HOUR = 3;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly EmailVerificationTokenRepositoryInterface $tokenRepository,
        private readonly InvitationService $invitationService,
        private readonly ConnectionInterface $db,
        private readonly RateLimiter $rateLimiter,
        #[Config('registration.verification_ttl_hours')]
        private readonly int $ttlHours,
        #[Config('registration.frontend_url')]
        private readonly string $frontendUrl,
    ) {}

    /**
     * Creates an account.
     *
     * With an invitation, the account is verified at once: the link was emailed to that
     * address, so opening it already proves the address. The invited address is used,
     * whatever email was typed. Without one, the account stays unverified and the
     * verification email is sent.
     *
     * Everything happens in one transaction: if the email cannot be sent, no account is
     * left behind, so the person can simply try again.
     *
     * @throws RegistrationDisabledException when sign-up is closed
     * @throws InvitationRequiredException in invite mode, without an invitation
     * @throws InvalidInvitationException when the invitation is unknown, accepted or expired
     */
    public function register(
        string $name,
        string $email,
        string $password,
        string $locale,
        ?string $invitationToken = null,
    ): User {
        $mode = $this->invitationService->mode();

        if ($mode === RegistrationMode::Closed) {
            throw new RegistrationDisabledException;
        }

        $invitation = null;

        if ($invitationToken !== null && $invitationToken !== '') {
            $invitation = $this->invitationService->findPending($invitationToken)
                ?? throw new InvalidInvitationException;
        } elseif ($mode === RegistrationMode::Invite) {
            throw new InvitationRequiredException;
        }

        $email = $invitation->email ?? mb_strtolower($email);

        return $this->db->transaction(function () use ($name, $email, $password, $locale, $invitation): User {
            $user = $this->userRepository->create($name, $email, $password, $locale);

            if ($invitation !== null) {
                $this->invitationService->markAccepted($invitation);
                $this->userRepository->markEmailVerified($user);
            } else {
                $this->sendVerificationEmail($user);
            }

            return $user;
        });
    }

    /**
     * Verifies the address behind the link and returns its user, who can then be signed in.
     *
     * @throws InvalidVerificationTokenException when the token is unknown, already used or expired
     */
    public function verifyEmail(string $plainToken): User
    {
        $token = $this->tokenRepository->findByHash($this->hash($plainToken));

        if ($token === null || $token->used_at !== null || $token->expires_at->isPast()) {
            throw new InvalidVerificationTokenException;
        }

        $user = $token->user;

        $this->db->transaction(function () use ($token, $user): void {
            $this->tokenRepository->markUsed($token);

            if ($user->email_verified_at === null) {
                $this->userRepository->markEmailVerified($user);
            }
        });

        return $user;
    }

    /**
     * Sends a new link to an unverified account.
     *
     * Does nothing, silently, for an unknown or already verified address, or past the hourly limit,
     * so the answer never reveals which emails have an account.
     */
    public function resendVerificationEmail(string $email): void
    {
        $email = mb_strtolower($email);
        $user = $this->userRepository->findByEmail($email);

        if ($user === null || $user->email_verified_at !== null) {
            return;
        }

        $key = 'verification-email:'.sha1($email);

        if ($this->rateLimiter->tooManyAttempts($key, self::MAX_RESENDS_PER_HOUR)) {
            return;
        }

        $this->rateLimiter->hit($key, 3600);
        $this->sendVerificationEmail($user);
    }

    private function sendVerificationEmail(User $user): void
    {
        // A new link replaces the previous ones.
        $this->tokenRepository->deleteUnusedForUser($user->id);

        // 32 random bytes, 64 hex characters: impossible to guess. Only its hash is stored.
        $plainToken = bin2hex(random_bytes(32));

        $this->tokenRepository->create(
            $user->id,
            $this->hash($plainToken),
            CarbonImmutable::now()->addHours($this->ttlHours),
        );

        $user->notify(new VerifyEmailNotification($this->verificationUrl($plainToken), $this->ttlHours));
    }

    private function verificationUrl(string $plainToken): string
    {
        return rtrim($this->frontendUrl, '/').'/verifier-email?token='.$plainToken;
    }

    private function hash(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
