<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TlsAllowedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Caddy asks from inside the network, with no company address.
        $this->flushHeaders();
    }

    public function test_existing_companies_and_the_bare_domain_get_a_certificate(): void
    {
        $this->get('/internal/tls-allowed?domain=acme.localhost')->assertOk();
        $this->get('/internal/tls-allowed?domain=ACME.localhost')->assertOk();
        $this->get('/internal/tls-allowed?domain=localhost')->assertOk();
    }

    public function test_a_suspended_company_keeps_its_certificate(): void
    {
        $this->tenant->forceFill(['status' => 'suspended'])->save();

        $this->get('/internal/tls-allowed?domain=acme.localhost')->assertOk();
    }

    public function test_anything_else_gets_none(): void
    {
        $this->get('/internal/tls-allowed?domain=nobody.localhost')->assertNotFound();
        $this->get('/internal/tls-allowed?domain=www.acme.localhost')->assertNotFound();
        $this->get('/internal/tls-allowed?domain=acme.evil.example')->assertNotFound();
        $this->get('/internal/tls-allowed')->assertNotFound();
    }
}
