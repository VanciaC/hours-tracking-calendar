<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Role of a user. Only given on the server, with artisan commands (RG-13).
 */
enum Role: string
{
    case User = 'user';
    case Admin = 'admin';
}
