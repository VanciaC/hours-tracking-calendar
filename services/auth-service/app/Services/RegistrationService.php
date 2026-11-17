<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\LoginResult;
use App\Exceptions\InvalidVerificationTokenException;
use App\Exceptions\RegistrationDisabledException;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Repositories\Contracts\EmailVerificationTokenRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\ConnectionInterface;

/**
 * Sign-up and email verification use cases (US-03, US-22, US-23).
 */
final class RegistrationService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly EmailVerificationTokenRepositoryInterface $tokenRepository,
        private readonly TokenService $tokenService,
        private readonly ConnectionInterface $db,
        #[Config('registration.enabled')]
        private readonly bool $enabled,
        #[Config('registration.verification_ttl_hours')]
        private readonly int $ttlHours,
        #[Config('registration.frontend_url')]
        private readonly string $frontendUrl,
    ) {}

    /**
     * Creates an unverified account and sends the verification email.
     *
     * Both happen in one transaction: if the email cannot be sent, no account is left behind,
     * so the person can simply try again.
     *
     * @throws RegistrationDisabledException when public sign-up is turned off
     */
    public function register(string $name, string $email, string $password, string $locale): User
    {
        if (! $this->enabled) {
            throw new RegistrationDisabledException;
        }

        return $this->db->transaction(function () use ($name, $email, $password, $locale): User {
            $user = $this->userRepository->create($name, mb_strtolower($email), $password, $locale);
            $this->sendVerificationEmail($user);

            return $user;
        });
    }

    /**
     * Verifies the address behind the link, then logs the user in.
     *
     * @throws InvalidVerificationTokenException when the token is unknown, already used or expired
     */
    public function verifyEmail(string $plainToken): LoginResult
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

        return new LoginResult($user, $this->tokenService->issueFor($user));
    }

    /**
     * Sends a new link to an unverified account.
     *
     * Does nothing, silently, for an unknown or already verified address,
     * so the answer never reveals which emails have an account.
     */
    public function resendVerificationEmail(string $email): void
    {
        $user = $this->userRepository->findByEmail(mb_strtolower($email));

        if ($user === null || $user->email_verified_at !== null) {
            return;
        }

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
