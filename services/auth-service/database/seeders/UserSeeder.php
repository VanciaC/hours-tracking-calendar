<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo accounts (password "password"):
 * - test@example.com, a regular user (id 1 on a fresh database), who owns the demo hours
 * - admin@example.com, an administrator, to try the administration area
 */
final class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->demoUser('test@example.com', 'Demo User', Role::User);
        $this->demoUser('admin@example.com', 'Demo Admin', Role::Admin);
    }

    private function demoUser(string $email, string $name, Role $role): void
    {
        // Idempotent: updates the user if it already exists.
        // The "hashed" cast on User::$password hashes the value on save.
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => 'password'],
        );

        // Not fillable on purpose, so set explicitly. Demo users must be verified to sign in (RG-11).
        $user->forceFill([
            'role' => $role->value,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();
    }
}
