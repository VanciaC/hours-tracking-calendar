<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InvalidResetTokenException;
use App\Notifications\ResetPasswordNotification;
use App\Repositories\Contracts\PasswordResetTokenRepositoryInterface;
use App\Repositories\Contracts\RefreshTokenRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Tenancy\CurrentTenant;
use App\Tenancy\FrontendUrl;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiter;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\ConnectionInterface;

/**
 * Forgotten password: a single-use link by email, then a new password (US-24, RG-15).
 */
final class PasswordResetService
{
    /** Reset emails that can be asked per address, per hour. */
    private const MAX_REQUESTS_PER_HOUR = 3;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly PasswordResetTokenRepositoryInterface $tokenRepository,
        private readonly RefreshTokenRepositoryInterface $refreshTokenRepository,
        private readonly ConnectionInterface $db,
        private readonly RateLimiter $rateLimiter,
        private readonly CurrentTenant $currentTenant,
        private readonly FrontendUrl $frontendUrl,
        #[Config('registration.password_reset_ttl_minutes')]
        private readonly int $ttlMinutes,
    ) {}

    /**
     * Sends a reset link to a verified account of the current company.
     *
     * Does nothing, silently, for an unknown or unverified address, or past the hourly limit,
     * so the answer never reveals which emails have an account.
     */
    public function requestReset(string $email): void
    {
        $email = mb_strtolower($email);
        $key = 'password-reset:'.sha1($this->currentTenant->require()->id.'|'.$email);

        // Counted for every address, known or not: the limit itself says nothing about the accounts.
        if ($this->rateLimiter->tooManyAttempts($key, self::MAX_REQUESTS_PER_HOUR)) {
            return;
        }

        $this->rateLimiter->hit($key, 3600);

        // Limited to the current company by the tenant scope of the User model.
        $user = $this->userRepository->findByEmail($email);

        // An unverified account cannot sign in anyway: it needs the verification email instead.
        if ($user === null || $user->email_verified_at === null) {
            return;
        }

        $this->db->transaction(function () use ($user): void {
            // A new link replaces the previous ones.
            $this->tokenRepository->deleteUnusedForUser($user->id);

            // 32 random bytes, 64 hex characters: impossible to guess. Only its hash is stored.
            $plainToken = bin2hex(random_bytes(32));

            $this->tokenRepository->create(
                $user->id,
                $this->hash($plainToken),
                CarbonImmutable::now()->addMinutes($this->ttlMinutes),
            );

            $url = $this->frontendUrl->to('/reinitialiser-mot-de-passe', ['token' => $plainToken]);

            $user->notify(new ResetPasswordNotification($url, $this->ttlMinutes));
        });
    }

    /**
     * Sets the new password, then signs out every session of the account: whoever knew
     * the old password is disconnected too.
     *
     * @throws InvalidResetTokenException when the token is unknown, already used, expired,
     *                                    or belongs to another company's account
     */
    public function resetPassword(string $plainToken, string $password): void
    {
        $token = $this->tokenRepository->findByHash($this->hash($plainToken));

        if ($token === null || $token->used_at !== null || $token->expires_at->isPast()) {
            throw new InvalidResetTokenException;
        }

        // Limited to the current company: a link of another company finds nobody here.
        $user = $token->user()->first() ?? throw new InvalidResetTokenException;

        $this->db->transaction(function () use ($token, $user, $password): void {
            $this->tokenRepository->markUsed($token);
            $this->userRepository->updatePassword($user, $password);
            // Any other link still pending becomes useless.
            $this->tokenRepository->deleteUnusedForUser($user->id);
            $this->refreshTokenRepository->revokeAllForUser($user->id);
        });
    }

    private function hash(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
