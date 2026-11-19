<?php

namespace Tests;

use App\Models\Tenant;
use App\Tenancy\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** The company every test runs in, unless it switches with actAsTenant(). */
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Tests without the database (schema, unit tests) have no company to create.
        if (! in_array(RefreshDatabase::class, class_uses_recursive($this), true)) {
            return;
        }

        $this->tenant = Tenant::factory()->create(['slug' => 'acme', 'name' => 'Acme']);
        $this->actAsTenant($this->tenant);
    }

    /**
     * Creates the next rows in this company, and sends the next requests from its subdomain.
     */
    protected function actAsTenant(Tenant $tenant): void
    {
        $this->app->make(CurrentTenant::class)->set($tenant);
        $this->withHeader('X-Forwarded-Host', $tenant->slug.'.localhost');
    }
}
