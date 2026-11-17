<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * The verification link is unknown, already used or expired (US-22).
 */
final class InvalidVerificationTokenException extends ApiException
{
    public function __construct()
    {
        parent::__construct('This verification link is invalid or has expired.');
    }

    public function errorCode(): string
    {
        return 'INVALID_VERIFICATION_TOKEN';
    }

    public function status(): int
    {
        return 400;
    }
}
