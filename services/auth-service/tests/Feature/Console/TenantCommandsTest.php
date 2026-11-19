<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class TenantCommandsTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'registration.mode' => 'invite',
            'registration.frontend_url' => 'https://{tenant}.example.test',
        ]);
        Notification::fake();
    }

    public function test_tenant_create_makes_a_company_whose_invited_first_admin_becomes_admin(): void
    {
        $this->artisan('tenant:create', ['slug' => 'dupont', 'name' => 'Boulangerie Dupont', '--admin' => 'Patron@Dupont.fr'])
            ->assertSuccessful();

        $dupont = Tenant::query()->where('slug', 'dupont')->firstOrFail();
        $this->assertSame('Boulangerie Dupont', $dupont->name);
        $this->assertTrue($dupont->isActive());

        $token = $this->invitationToken('patron@dupont.fr', 'https://dupont.example.test/inscription?invitation=');

        $this->actAsTenant($dupont);
        $this->graphQL(
            'mutation ($token: String) { register(name: "Patron", email: "patron@dupont.fr", password: "a-long-enough-password", passwordConfirmation: "a-long-enough-password", invitationToken: $token) { verified } }',
            ['token' => $token],
        )->assertJsonPath('data.register.verified', true);

        $boss = User::query()->where('email', 'patron@dupont.fr')->firstOrFail();
        $this->assertTrue($boss->isAdmin());
        $this->assertSame($dupont->id, $boss->tenant_id);
    }

    public function test_tenant_create_without_admin_sends_nothing(): void
    {
        $this->artisan('tenant:create', ['slug' => 'globex', 'name' => 'Globex'])->assertSuccessful();

        $this->assertDatabaseHas('tenants', ['slug' => 'globex']);
        Notification::assertNothingSent();
    }

    public function test_tenant_create_refuses_invalid_reserved_or_taken_subdomains(): void
    {
        foreach (['dupont!', '-dupont', 'du.pont', 'www', 'acme'] as $slug) {
            $this->artisan('tenant:create', ['slug' => $slug, 'name' => 'Test'])->assertFailed();
        }

        // Only the company of the test setup.
        $this->assertDatabaseCount('tenants', 1);
    }

    public function test_a_company_can_be_suspended_then_resumed(): void
    {
        $this->artisan('tenant:suspend', ['slug' => 'acme'])->assertSuccessful();
        $this->assertSame(TenantStatus::Suspended, $this->tenant->refresh()->status);

        $this->artisan('tenant:suspend', ['slug' => 'acme', '--resume' => true])->assertSuccessful();
        $this->assertSame(TenantStatus::Active, $this->tenant->refresh()->status);
    }

    /**
     * Reads the token from the invitation emailed to the address, and checks the link opens the right company.
     */
    private function invitationToken(string $email, string $expectedStart): string
    {
        $token = '';

        Notification::assertSentOnDemand(
            InvitationNotification::class,
            function (InvitationNotification $notification, array $channels, AnonymousNotifiable $notifiable) use ($email, $expectedStart, &$token): bool {
                if ($notifiable->routes['mail'] !== $email || ! str_starts_with($notification->url, $expectedStart)) {
                    return false;
                }

                parse_str((string) parse_url($notification->url, PHP_URL_QUERY), $query);
                $token = (string) $query['invitation'];

                return true;
            },
        );

        return $token;
    }
}
