<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\EmailVerificationToken;
use App\Repositories\Contracts\EmailVerificationTokenRepositoryInterface;
use Carbon\CarbonImmutable;

final class EmailVerificationTokenRepository implements EmailVerificationTokenRepositoryInterface
{
    public function create(int $userId, string $tokenHash, CarbonImmutable $expiresAt): EmailVerificationToken
    {
        return EmailVerificationToken::query()->create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);
    }

    public function findByHash(string $tokenHash): ?EmailVerificationToken
    {
        return EmailVerificationToken::query()->where('token_hash', $tokenHash)->first();
    }

    public function markUsed(EmailVerificationToken $token): void
    {
        $token->forceFill(['used_at' => CarbonImmutable::now()])->save();
    }

    public function deleteUnusedForUser(int $userId): void
    {
        EmailVerificationToken::query()
            ->where('user_id', $userId)
            ->whereNull('used_at')
            ->delete();
    }
}
