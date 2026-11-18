<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;

/**
 * The requester is authenticated but not allowed to do this.
 */
final class ForbiddenException extends Exception implements ClientAware, ProvidesExtensions
{
    public static function adminOnly(): self
    {
        return new self('This action is reserved to administrators.');
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
