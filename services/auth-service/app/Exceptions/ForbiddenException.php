<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;
use RuntimeException;

/**
 * Signed in, but without the role needed for this operation (US-26).
 */
final class ForbiddenException extends RuntimeException implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('You are not allowed to do this.');
    }

    public function isClientSafe(): bool
    {
        return true;
    }

    /**
     * @return array{code: string}
     */
    public function getExtensions(): array
    {
        return ['code' => 'FORBIDDEN'];
    }
}
