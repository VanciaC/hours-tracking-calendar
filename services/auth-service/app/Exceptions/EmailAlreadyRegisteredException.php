<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;
use RuntimeException;

/**
 * An admin tried to invite an address that already has an account.
 * Only admins see it, so revealing that the account exists is fine here.
 */
final class EmailAlreadyRegisteredException extends RuntimeException implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('This email address already has an account.');
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
        return ['code' => 'EMAIL_ALREADY_REGISTERED'];
    }
}
