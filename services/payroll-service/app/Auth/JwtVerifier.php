<?php

declare(strict_types=1);

namespace App\Auth;

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
     * Returns the user id ("sub" claim) of a valid token, null otherwise.
     *
     * A token is valid when its signature matches the public key,
     * it is not expired, and it was issued by auth-service.
     */
    public function verify(string $token): ?int
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

        return ctype_digit($subject) ? (int) $subject : null;
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
