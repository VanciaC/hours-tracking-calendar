<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Too many failed sign-ins for this address from this IP (US-01).
 */
final class TooManyLoginAttemptsException extends ApiException
{
    public function __construct(
        public readonly int $retryAfterSeconds,
    ) {
        parent::__construct('Too many attempts. Please try again later.');
    }

    public function errorCode(): string
    {
        return 'TOO_MANY_ATTEMPTS';
    }

    public function status(): int
    {
        return 429;
    }

    /**
     * @return array<string, string>
     */
    public function headers(): array
    {
        return ['Retry-After' => (string) $this->retryAfterSeconds];
    }
}
