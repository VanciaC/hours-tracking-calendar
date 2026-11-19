<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Testing\TestResponse;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Each company only reaches its own accounts, from its own subdomain.
 */
final class TenancyTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    public function test_the_health_check_needs_no_company(): void
    {
        $this->flushHeaders();

        $this->get('/up')->assertOk();
    }

    public function test_the_subgraph_schema_needs_no_company_but_nothing_else_does(): void
    {
        $this->flushHeaders();

        $this->postJson('/graphql', ['query' => 'query SubgraphIntrospectQuery { _service { sdl } }'])
            ->assertOk();

        $this->postJson('/graphql', ['query' => '{ registrationMode }'])
            ->assertStatus(404)
            ->assertJsonPath('code', 'TENANT_NOT_FOUND');
    }

    public function test_an_unknown_subdomain_or_another_domain_is_refused(): void
    {
        $this->withHeader('X-Forwarded-Host', 'nobody.localhost');
        $this->login('jane@example.com', 'password')->assertStatus(404)->assertJsonPath('code', 'TENANT_NOT_FOUND');

        $this->withHeader('X-Forwarded-Host', 'acme.evil.example');
        $this->login('jane@example.com', 'password')->assertStatus(404);

        // Deeper subdomains are not companies either.
        $this->withHeader('X-Forwarded-Host', 'www.acme.localhost');
        $this->login('jane@example.com', 'password')->assertStatus(404);
    }

    public function test_a_suspended_company_is_refused(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $this->tenant->forceFill(['status' => 'suspended'])->save();

        $this->login('jane@example.com', 'password')
            ->assertStatus(403)
            ->assertJsonPath('code', 'TENANT_SUSPENDED');
    }

    public function test_an_account_can_only_sign_in_on_its_own_company(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $this->login('jane@example.com', 'password')->assertOk();

        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));

        $this->login('jane@example.com', 'password')
            ->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');
    }

    public function test_the_same_address_can_have_a_separate_account_in_each_company(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));
        User::factory()->create(['email' => 'jane@example.com', 'password' => 'another-password']);

        $this->login('jane@example.com', 'another-password')->assertOk();
        $this->login('jane@example.com', 'password')->assertStatus(401);
    }

    public function test_the_access_token_carries_the_company(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $payload = $this->payloadOf($this->login('jane@example.com', 'password'));

        $this->assertSame($this->tenant->id, $payload['tid']);
        $this->assertSame('acme', $payload['tenant']);
    }

    public function test_a_token_is_useless_on_another_company(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $accessToken = (string) $this->login('jane@example.com', 'password')->json('accessToken');

        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));

        $this->withHeader('Authorization', 'Bearer '.$accessToken)
            ->graphQL('{ me { id } }')
            ->assertJsonPath('data.me', null);
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function login(string $email, string $password): TestResponse
    {
        return $this->postJson('/auth/login', ['email' => $email, 'password' => $password]);
    }

    /**
     * @param  TestResponse<JsonResponse>  $response
     * @return array<string, mixed>
     */
    private function payloadOf(TestResponse $response): array
    {
        $accessToken = (string) $response->json('accessToken');

        // The payload is the second, base64url-encoded part of the JWT.
        return (array) json_decode((string) base64_decode(strtr(explode('.', $accessToken)[1], '-_', '+/')), true);
    }
}
