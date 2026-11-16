<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use RuntimeException;

/**
 * Thrown when the email/password pair does not match any user.
 *
 * The message is deliberately generic: it must not reveal whether
 * the email exists or the password is wrong (US-01).
 */
final class InvalidCredentialsException extends RuntimeException implements ClientAware
{
    public function __construct()
    {
        parent::__construct('Invalid credentials.');
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}
