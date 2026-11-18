<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo teammates for the admin team schedule. Development only.
 * Their hours are filled by planning-service: make demo-team runs both.
 */
final class TeamDemoSeeder extends Seeder
{
    private const TEAM = [
        'alice@example.com' => 'Alice Martin',
        'bruno@example.com' => 'Bruno Lefèvre',
        'chloe@example.com' => 'Chloé Dubois',
        'david@example.com' => 'David Roux',
        'emma@example.com' => 'Emma Petit',
        'farid@example.com' => 'Farid Benali',
    ];

    public function run(): void
    {
        foreach (self::TEAM as $email => $name) {
            $user = User::query()->firstOrNew(['email' => $email]);

            $user->fill(['name' => $name, 'password' => Hash::make('password'), 'locale' => 'fr']);
            $user->forceFill(['email_verified_at' => $user->email_verified_at ?? CarbonImmutable::now()]);
            $user->save();
        }
    }
}
