<?php

declare(strict_types=1);

namespace App\Auth;

use App\Enums\Role;

/**
 * Claims of a valid access token.
 */
final readonly class VerifiedToken
{
    public function __construct(
        public int $userId,
        public Role $role,
    ) {}
}
