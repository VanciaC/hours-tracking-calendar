<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the demo user used across services (id 1 on a fresh database).
 *
 * Login: test@example.com / password
 */
final class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: updates the demo user if it already exists.
        // The "hashed" cast on User::$password hashes the value on save.
        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Demo User', 'password' => 'password'],
        );
    }
}
