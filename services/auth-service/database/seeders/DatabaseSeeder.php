<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use App\Tenancy\CurrentTenant;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo data lives in the "demo" company: demo.localhost:5173 in development.
        app(CurrentTenant::class)->set(
            Tenant::query()->firstOrCreate(['slug' => 'demo'], ['name' => 'Demo']),
        );

        $this->call([
            UserSeeder::class,
        ]);
    }
}
