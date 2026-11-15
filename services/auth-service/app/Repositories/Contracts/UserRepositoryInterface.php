<?php declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\User;

/**
 * Data access for users.
 *
 * Technical contract only, no business rules here.
 */
interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
}