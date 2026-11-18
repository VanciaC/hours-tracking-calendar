<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Enumerable;

/**
 * Data access for users.
 *
 * Technical contract only, no business rules here.
 */
interface UserRepositoryInterface
{
    public function findById(int $id): ?User;

    public function findByEmail(string $email): ?User;

    /**
     * @param  string  $password  plain text, hashed by the model cast
     */
    public function create(string $name, string $email, string $password, string $locale): User;

    public function markEmailVerified(User $user): void;

    public function setRole(User $user, Role $role): void;

    /**
     * Users with the "user" role, by name, optionally filtered on name or email.
     *
     * @return LengthAwarePaginator<int, User>
     */
    public function paginateRegularUsers(?string $search, int $page, int $perPage): LengthAwarePaginator;

    /**
     * A user with the "user" role, null for an unknown id or an admin.
     */
    public function findRegularUser(int $id): ?User;

    /**
     * Every verified account, admins included, ordered by name.
     *
     * @return Enumerable<int, User>
     */
    public function findVerifiedUsers(): Enumerable;
}
