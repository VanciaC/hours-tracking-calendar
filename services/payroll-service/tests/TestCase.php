<?php

namespace Tests;

use App\Tenancy\CurrentTenant;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** The company every test runs in, unless it switches with actAsTenant(). */
    protected const TENANT_ID = 1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actAsTenant(self::TENANT_ID);
    }

    /**
     * Creates the next rows in this company. Requests run in the company of their user's token.
     */
    protected function actAsTenant(int $tenantId): void
    {
        $this->app->make(CurrentTenant::class)->set($tenantId);
    }
}
