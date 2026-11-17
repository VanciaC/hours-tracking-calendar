<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * The password is right but the email address is not verified yet (RG-11).
 */
final class EmailNotVerifiedException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Your email address is not verified yet.');
    }

    public function errorCode(): string
    {
        return 'EMAIL_NOT_VERIFIED';
    }

    public function status(): int
    {
        return 403;
    }
}
