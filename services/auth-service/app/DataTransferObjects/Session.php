<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * A signed-in session: a short-lived access token and the refresh token that renews it.
 */
final readonly class Session
{
    public function __construct(
        public User $user,
        public IssuedToken $accessToken,
        /** Plain value, sent once in the cookie: only its hash is stored. */
        public string $refreshToken,
        public CarbonImmutable $refreshExpiresAt,
    ) {}
}
