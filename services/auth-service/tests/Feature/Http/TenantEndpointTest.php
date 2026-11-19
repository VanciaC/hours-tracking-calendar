<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TenantEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_gives_the_company_of_the_address(): void
    {
        $this->getJson('/auth/tenant')
            ->assertOk()
            ->assertExactJson(['slug' => 'acme', 'name' => 'Acme']);
    }

    public function test_an_unknown_address_gets_a_clear_code(): void
    {
        $this->withHeader('X-Forwarded-Host', 'nobody.localhost')
            ->getJson('/auth/tenant')
            ->assertStatus(404)
            ->assertJsonPath('code', 'TENANT_NOT_FOUND');
    }

    public function test_a_suspended_company_gets_a_clear_code(): void
    {
        $this->tenant->forceFill(['status' => 'suspended'])->save();

        $this->getJson('/auth/tenant')
            ->assertStatus(403)
            ->assertJsonPath('code', 'TENANT_SUSPENDED');
    }
}
