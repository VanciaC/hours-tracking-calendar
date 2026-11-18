<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\PasswordResetToken;
use Carbon\CarbonImmutable;

/**
 * Data access for password reset tokens.
 *
 * Technical contract only, no business rules here.
 */
interface PasswordResetTokenRepositoryInterface
{
    public function create(int $userId, string $tokenHash, CarbonImmutable $expiresAt): PasswordResetToken;

    public function findByHash(string $tokenHash): ?PasswordResetToken;

    public function markUsed(PasswordResetToken $token): void;

    public function deleteUnusedForUser(int $userId): void;
}
