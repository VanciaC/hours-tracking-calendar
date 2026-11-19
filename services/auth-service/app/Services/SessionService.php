<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\Session;
use App\Exceptions\InvalidRefreshTokenException;
use App\Models\User;
use App\Repositories\Contracts\RefreshTokenRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Support\Str;

/**
 * Starts, renews and ends sessions (US-02, US-25).
 *
 * A session is a "family" of refresh tokens: each refresh replaces the token by a new one (rotation).
 * Replaying an old token means it was stolen, so the whole family is revoked.
 */
final class SessionService
{
    public function __construct(
        private readonly RefreshTokenRepositoryInterface $refreshTokenRepository,
        private readonly TokenService $tokenService,
        #[Config('jwt.refresh_ttl_days')]
        private readonly int $refreshTtlDays,
        #[Config('jwt.refresh_reuse_grace_seconds')]
        private readonly int $reuseGraceSeconds,
    ) {}

    public function start(User $user): Session
    {
        return $this->issue($user, (string) Str::uuid());
    }

    /**
     * Exchanges a refresh token for a new session of the same family.
     *
     * @throws InvalidRefreshTokenException when the token is unknown, expired, revoked, replayed,
     *                                      or belongs to another company's account
     */
    public function refresh(string $plainToken): Session
    {
        $token = $this->refreshTokenRepository->findByHash($this->hash($plainToken));

        if ($token === null || $token->revoked_at !== null || $token->expires_at->isPast()) {
            throw new InvalidRefreshTokenException;
        }

        // Limited to the current company: a session of another company finds nobody here.
        $user = $token->user()->first();

        if ($user === null) {
            throw new InvalidRefreshTokenException;
        }

        if ($token->used_at === null) {
            $this->refreshTokenRepository->markUsed($token);
        } elseif ($token->used_at->addSeconds($this->reuseGraceSeconds)->isPast()) {
            // Already exchanged a while ago: someone is replaying it. End the session for everyone.
            $this->refreshTokenRepository->revokeFamily($token->family_id);

            throw new InvalidRefreshTokenException;
        }
        // Otherwise, exchanged a few seconds ago: two tabs refreshing at once, not a theft.

        return $this->issue($user, $token->family_id);
    }

    /**
     * Revokes the session of this refresh token. Does nothing without a valid token.
     */
    public function end(?string $plainToken): void
    {
        if ($plainToken === null) {
            return;
        }

        $token = $this->refreshTokenRepository->findByHash($this->hash($plainToken));

        if ($token !== null) {
            $this->refreshTokenRepository->revokeFamily($token->family_id);
        }
    }

    private function issue(User $user, string $familyId): Session
    {
        // 32 random bytes, 64 hex characters: impossible to guess. Only its hash is stored.
        $plainToken = bin2hex(random_bytes(32));
        $expiresAt = CarbonImmutable::now()->addDays($this->refreshTtlDays);

        $this->refreshTokenRepository->create($user->id, $familyId, $this->hash($plainToken), $expiresAt);

        return new Session($user, $this->tokenService->issueFor($user), $plainToken, $expiresAt);
    }

    private function hash(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
