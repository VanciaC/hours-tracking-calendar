<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors the roles defined in auth-service, read from the access token.
 */
enum Role: string
{
    case User = 'user';
    case Admin = 'admin';
}
