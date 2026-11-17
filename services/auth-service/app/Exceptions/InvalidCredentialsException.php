<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Thrown when the email/password pair does not match any user.
 *
 * The message is deliberately generic: it must not reveal whether
 * the email exists or the password is wrong (US-01).
 */
final class InvalidCredentialsException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Invalid credentials.');
    }

    public function errorCode(): string
    {
        return 'INVALID_CREDENTIALS';
    }

    public function status(): int
    {
        return 401;
    }
}
