<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\Role;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Enumerable;

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

    public function setRole(User $user, Role $role): void
    {
        $user->forceFill(['role' => $role->value])->save();
    }

    public function paginateRegularUsers(?string $search, int $page, int $perPage): LengthAwarePaginator
    {
        return User::query()
            ->where('role', Role::User->value)
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                // % and _ typed by the user are searched as plain characters, not as wildcards.
                $pattern = '%'.addcslashes((string) $search, '\\%_').'%';

                $query->where(fn (Builder $inner) => $inner
                    ->where('name', 'like', $pattern)
                    ->orWhere('email', 'like', $pattern));
            })
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(perPage: $perPage, page: $page);
    }

    public function findRegularUser(int $id): ?User
    {
        return User::query()->where('role', Role::User->value)->find($id);
    }

    /**
     * @return Enumerable<int, User>
     */
    public function findVerifiedUsers(): Enumerable
    {
        return User::query()
            ->whereNotNull('email_verified_at')
            ->orderBy('name')
            ->orderBy('id')
            ->get();
    }
}
