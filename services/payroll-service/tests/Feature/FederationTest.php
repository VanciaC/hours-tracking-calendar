<?php

namespace Tests\Feature;

use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

class FederationTest extends TestCase
{
    use MakesGraphQLRequests;

    public function test_le_sdl_du_sous_graphe_est_en_federation_2(): void
    {
        $sdl = $this->graphQL(/** @lang GraphQL */ '{ _service { sdl } }')
            ->assertOk()
            ->json('data._service.sdl');

        $this->assertIsString($sdl);
        $this->assertStringContainsString('extend schema @link(', $sdl);
        $this->assertStringContainsString('specs.apollo.dev', $sdl);
        $this->assertStringContainsString('@key(fields: "id")', $sdl);
    }
}
