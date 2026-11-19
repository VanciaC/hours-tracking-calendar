<?php

namespace Database\Seeders;

use App\Tenancy\CurrentTenant;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** The "demo" company, created first by auth-service's seeder on a fresh database. */
    private const DEMO_TENANT_ID = 1;

    public function run(): void
    {
        app(CurrentTenant::class)->set(self::DEMO_TENANT_ID);

        $this->call([
            WorkDaySeeder::class,
        ]);
    }
}
