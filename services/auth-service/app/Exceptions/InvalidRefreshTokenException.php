<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * No refresh token, or one that is unknown, expired, revoked or replayed (US-25).
 * The user has to sign in again.
 */
final class InvalidRefreshTokenException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Your session has expired. Please sign in again.');
    }

    public function errorCode(): string
    {
        return 'INVALID_REFRESH_TOKEN';
    }

    public function status(): int
    {
        return 401;
    }
}
