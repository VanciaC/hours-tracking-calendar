<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Models\User;

/**
 * Outcome of a successful login.
 */
final readonly class LoginResult
{
    public function __construct(
        public User $user,
        public IssuedToken $token,
    ) {}
}
