<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;
use RuntimeException;

/**
 * Sign-up is by invitation only (REGISTRATION_MODE=invite) and no invitation was given.
 */
final class InvitationRequiredException extends RuntimeException implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('An invitation is required to create an account.');
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
        return ['code' => 'INVITATION_REQUIRED'];
    }
}
