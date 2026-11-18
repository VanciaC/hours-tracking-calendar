<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\IssuedToken;
use App\Models\User;
use Carbon\CarbonImmutable;
use Firebase\JWT\JWT;
use Illuminate\Container\Attributes\Config;
use RuntimeException;

/**
 * Issues RS256-signed access tokens.
 */
final class TokenService
{
    private const ALGORITHM = 'RS256';

    public function __construct(
        #[Config('jwt.private_key_path')]
        private readonly string $privateKeyPath,
        #[Config('jwt.ttl_minutes')]
        private readonly int $ttlMinutes,
        #[Config('jwt.issuer')]
        private readonly string $issuer,
    ) {}

    public function issueFor(User $user): IssuedToken
    {
        $issuedAt = CarbonImmutable::now();
        $expiresAt = $issuedAt->addMinutes($this->ttlMinutes);

        $payload = [
            'iss' => $this->issuer,
            'sub' => (string) $user->getKey(),
            // Read by the other services, which have no users table (admin access, RG-12).
            'role' => $user->role,
            'iat' => $issuedAt->getTimestamp(),
            'exp' => $expiresAt->getTimestamp(),
        ];

        return new IssuedToken(
            accessToken: JWT::encode($payload, $this->privateKey(), self::ALGORITHM),
            expiresAt: $expiresAt,
            expiresIn: $this->ttlMinutes * 60,
        );
    }

    private function privateKey(): string
    {
        $key = @file_get_contents($this->privateKeyPath);

        if ($key === false) {
            throw new RuntimeException("Unable to read the JWT private key at {$this->privateKeyPath}.");
        }

        return $key;
    }
}
