<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use RuntimeException;

/**
 * Thrown when an authenticated user tries to access data that is not theirs.
 */
final class AccessDeniedException extends RuntimeException implements ClientAware
{
    public static function notOwner(): self
    {
        return new self('You can only access your own data.');
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}
