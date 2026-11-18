<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;

/**
 * The reset link is unknown, already used or expired.
 */
final class InvalidResetTokenException extends Exception implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('This password reset link is invalid or has expired.');
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
        return ['code' => 'INVALID_RESET_TOKEN'];
    }
}
