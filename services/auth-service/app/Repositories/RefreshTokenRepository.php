<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\RefreshToken;
use App\Repositories\Contracts\RefreshTokenRepositoryInterface;
use Carbon\CarbonImmutable;

final class RefreshTokenRepository implements RefreshTokenRepositoryInterface
{
    public function create(int $userId, string $familyId, string $tokenHash, CarbonImmutable $expiresAt): RefreshToken
    {
        return RefreshToken::query()->create([
            'user_id' => $userId,
            'family_id' => $familyId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);
    }

    public function findByHash(string $tokenHash): ?RefreshToken
    {
        return RefreshToken::query()->where('token_hash', $tokenHash)->first();
    }

    public function markUsed(RefreshToken $token): void
    {
        $token->forceFill(['used_at' => CarbonImmutable::now()])->save();
    }

    public function revokeFamily(string $familyId): void
    {
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => CarbonImmutable::now()]);
    }
}
