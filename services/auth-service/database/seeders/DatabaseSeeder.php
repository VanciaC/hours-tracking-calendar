<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use App\Tenancy\CurrentTenant;
use App\Tenancy\FrontendUrl;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(CurrentTenant $currentTenant, FrontendUrl $frontendUrl): void
    {
        // Demo data lives in the "demo" company: demo.localhost:5173 in development.
        $demo = Tenant::query()->firstOrCreate(['slug' => 'demo'], ['name' => 'Demo']);
        $currentTenant->set($demo);

        $this->command->info(sprintf(
            'Company "%s" %s (id %d): %s',
            $demo->name,
            $demo->wasRecentlyCreated ? 'created' : 'already there',
            $demo->id,
            $frontendUrl->to('/'),
        ));

        $this->call([
            UserSeeder::class,
        ]);

        $this->command->line('Sign in with test@example.com or admin@example.com, password "password".');
    }
}
