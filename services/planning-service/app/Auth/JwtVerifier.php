<?php

declare(strict_types=1);

namespace App\Auth;

use App\Enums\Role;
use DomainException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Container\Attributes\Config;
use RuntimeException;
use UnexpectedValueException;

/**
 * Verifies RS256 access tokens issued by auth-service.
 */
final class JwtVerifier
{
    private const ALGORITHM = 'RS256';

    public function __construct(
        #[Config('jwt.public_key_path')]
        private readonly string $publicKeyPath,
        #[Config('jwt.issuer')]
        private readonly string $issuer,
    ) {}

    /**
     * Returns the owner of a valid token, null otherwise.
     *
     * A token is valid when its signature matches the public key, it is not expired,
     * it was issued by auth-service, and it names the user's company.
     * A missing or unknown "role" claim means a regular user, so the safest role
     * always wins when in doubt. A missing company is refused: without it, nothing
     * could limit the data to the user's company.
     */
    public function verify(string $token): ?VerifiedToken
    {
        try {
            $claims = JWT::decode($token, new Key($this->publicKey(), self::ALGORITHM));
        } catch (UnexpectedValueException|DomainException) {
            // Bad signature, expired, malformed... the caller is simply not authenticated.
            return null;
        }

        if (($claims->iss ?? null) !== $this->issuer) {
            return null;
        }

        $subject = (string) ($claims->sub ?? '');
        $tenantId = $claims->tid ?? null;
        $tenantSlug = $claims->tenant ?? null;

        if (! ctype_digit($subject) || ! is_int($tenantId) || ! is_string($tenantSlug) || $tenantSlug === '') {
            return null;
        }

        $role = $claims->role ?? null;

        return new VerifiedToken(
            userId: (int) $subject,
            role: (is_string($role) ? Role::tryFrom($role) : null) ?? Role::User,
            tenantId: $tenantId,
            tenantSlug: $tenantSlug,
        );
    }

    private function publicKey(): string
    {
        $key = @file_get_contents($this->publicKeyPath);

        if ($key === false) {
            throw new RuntimeException("Unable to read the JWT public key at {$this->publicKeyPath}.");
        }

        return $key;
    }
}
