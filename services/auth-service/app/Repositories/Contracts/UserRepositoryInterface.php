<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\User;

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
}
