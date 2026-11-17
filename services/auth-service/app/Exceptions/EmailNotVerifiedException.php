<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use GraphQL\Error\ProvidesExtensions;
use RuntimeException;

/**
 * The password is right but the email address is not verified yet (RG-11).
 */
final class EmailNotVerifiedException extends RuntimeException implements ClientAware, ProvidesExtensions
{
    public function __construct()
    {
        parent::__construct('Your email address is not verified yet.');
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
        return ['code' => 'EMAIL_NOT_VERIFIED'];
    }
}
