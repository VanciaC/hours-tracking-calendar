<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\PasswordResetToken;
use App\Repositories\Contracts\PasswordResetTokenRepositoryInterface;
use Carbon\CarbonImmutable;

final class PasswordResetTokenRepository implements PasswordResetTokenRepositoryInterface
{
    public function create(int $userId, string $tokenHash, CarbonImmutable $expiresAt): PasswordResetToken
    {
        return PasswordResetToken::query()->create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);
    }

    public function findByHash(string $tokenHash): ?PasswordResetToken
    {
        return PasswordResetToken::query()->where('token_hash', $tokenHash)->first();
    }

    public function markUsed(PasswordResetToken $token): void
    {
        $token->forceFill(['used_at' => CarbonImmutable::now()])->save();
    }

    public function deleteUnusedForUser(int $userId): void
    {
        PasswordResetToken::query()
            ->where('user_id', $userId)
            ->whereNull('used_at')
            ->delete();
    }
}
