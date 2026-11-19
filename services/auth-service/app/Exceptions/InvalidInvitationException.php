<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;
use RuntimeException;

/**
 * The invitation is unknown, already accepted or expired.
 */
final class InvalidInvitationException extends RuntimeException implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('This invitation is invalid or has expired.');
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
        return ['code' => 'INVALID_INVITATION'];
    }
}
