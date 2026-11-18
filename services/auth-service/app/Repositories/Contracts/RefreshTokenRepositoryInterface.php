<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\RefreshToken;
use Carbon\CarbonImmutable;

/**
 * Data access for refresh tokens.
 *
 * Technical contract only, no business rules here.
 */
interface RefreshTokenRepositoryInterface
{
    public function create(int $userId, string $familyId, string $tokenHash, CarbonImmutable $expiresAt): RefreshToken;

    public function findByHash(string $tokenHash): ?RefreshToken;

    public function markUsed(RefreshToken $token): void;

    public function revokeFamily(string $familyId): void;

    /**
     * Revokes every session of the user, on every device.
     */
    public function revokeAllForUser(int $userId): void;
}
