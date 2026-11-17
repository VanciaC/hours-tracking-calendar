<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;

final class UserRepository implements UserRepositoryInterface
{
    public function findById(int $id): ?User
    {
        return User::query()->find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    public function create(string $name, string $email, string $password, string $locale): User
    {
        return User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'locale' => $locale,
        ]);
    }

    public function markEmailVerified(User $user): void
    {
        $user->forceFill(['email_verified_at' => CarbonImmutable::now()])->save();
    }
}
