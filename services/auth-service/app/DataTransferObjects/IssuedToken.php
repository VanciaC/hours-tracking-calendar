<?php declare(strict_types=1);

namespace App\DataTransferObjects;

use Carbon\CarbonImmutable;

/**
 * A signed access token and its expiration.
 */
final readonly class IssuedToken
{
    public function __construct(
        public string $accessToken,
        public CarbonImmutable $expiresAt,
        public int $expiresIn,
    ) {}
}