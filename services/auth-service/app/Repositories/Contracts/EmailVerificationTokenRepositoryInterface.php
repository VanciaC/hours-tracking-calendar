<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\EmailVerificationToken;
use Carbon\CarbonImmutable;

/**
 * Data access for email verification tokens.
 *
 * Technical contract only, no business rules here.
 */
interface EmailVerificationTokenRepositoryInterface
{
    public function create(int $userId, string $tokenHash, CarbonImmutable $expiresAt): EmailVerificationToken;

    public function findByHash(string $tokenHash): ?EmailVerificationToken;

    public function markUsed(EmailVerificationToken $token): void;

    public function deleteUnusedForUser(int $userId): void;
}
