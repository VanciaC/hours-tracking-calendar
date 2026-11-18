<?php

declare(strict_types=1);

namespace App\Auth;

use App\Enums\Role;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * The user behind a verified access token.
 *
 * This service does not store users: all it knows is the id from the
 * token's "sub" claim and the role from its "role" claim. Password and
 * "remember me" features belong to auth-service, so they are intentionally
 * empty here.
 */
final readonly class AuthenticatedUser implements Authenticatable
{
    public function __construct(
        public int $id,
        public Role $role = Role::User,
    ) {}

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    public function getAuthIdentifierName(): string
    {
        return 'id';
    }

    public function getAuthIdentifier(): int
    {
        return $this->id;
    }

    public function getAuthPasswordName(): string
    {
        return 'password';
    }

    public function getAuthPassword(): string
    {
        return '';
    }

    public function getRememberToken(): string
    {
        return '';
    }

    public function setRememberToken($value): void
    {
        // Not supported: there is no session in this service.
    }

    public function getRememberTokenName(): string
    {
        return '';
    }
}
