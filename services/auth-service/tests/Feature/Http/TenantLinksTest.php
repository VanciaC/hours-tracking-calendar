<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use App\Models\Tenant;
use App\Models\User;
use App\Notifications\InvitationNotification;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Emailed links open the right company, and only work there.
 */
final class TenantLinksTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const REGISTER = /** @lang GraphQL */ '
        mutation ($email: String!) {
            register(name: "Jane", email: $email, password: "a-long-enough-password", passwordConfirmation: "a-long-enough-password") {
                email
            }
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'registration.mode' => 'open',
            'registration.frontend_url' => 'https://{tenant}.example.test',
        ]);
        Notification::fake();
    }

    public function test_emailed_links_open_the_company_subdomain(): void
    {
        $this->graphQL(self::REGISTER, ['email' => 'jane@example.com']);
        $jane = User::query()->where('email', 'jane@example.com')->firstOrFail();

        Notification::assertSentTo(
            $jane,
            VerifyEmailNotification::class,
            fn (VerifyEmailNotification $notification): bool => str_starts_with($notification->url, 'https://acme.example.test/verifier-email?token='),
        );

        $bob = User::factory()->create(['email' => 'bob@example.com']);
        $this->graphQL('mutation { requestPasswordReset(email: "bob@example.com") }');

        Notification::assertSentTo(
            $bob,
            ResetPasswordNotification::class,
            fn (ResetPasswordNotification $notification): bool => str_starts_with($notification->url, 'https://acme.example.test/reinitialiser-mot-de-passe?token='),
        );
    }

    public function test_a_verification_link_only_works_on_its_own_company(): void
    {
        $this->graphQL(self::REGISTER, ['email' => 'jane@example.com']);
        $token = $this->verificationToken(User::query()->where('email', 'jane@example.com')->firstOrFail());

        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));

        $this->postJson('/auth/verify-email', ['token' => $token])
            ->assertStatus(400)
            ->assertJsonPath('code', 'INVALID_VERIFICATION_TOKEN');

        $this->actAsTenant($this->tenant);

        $this->postJson('/auth/verify-email', ['token' => $token])->assertOk();
    }

    public function test_an_address_with_an_account_in_another_company_can_still_sign_up_here(): void
    {
        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));
        User::factory()->create(['email' => 'jane@example.com']);

        $this->actAsTenant($this->tenant);

        $this->graphQL(self::REGISTER, ['email' => 'jane@example.com'])
            ->assertJsonPath('data.register.email', 'jane@example.com');

        // Taken in this company now: refused like before.
        $this->graphQL(self::REGISTER, ['email' => 'jane@example.com'])
            ->assertGraphQLValidationKeys(['email']);
    }

    public function test_an_invitation_only_works_on_its_own_company(): void
    {
        config(['registration.mode' => 'invite']);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'jwt')->graphQL('mutation { createInvitation(email: "jane@example.com") { id } }');
        $this->app['auth']->forgetGuards();
        $token = $this->invitationToken('jane@example.com');

        $this->actAsTenant(Tenant::factory()->create(['slug' => 'globex']));

        $this->graphQL('query ($token: String!) { invitation(token: $token) { email } }', ['token' => $token])
            ->assertJsonPath('data.invitation', null);
    }

    private function verificationToken(User $user): string
    {
        $token = '';

        Notification::assertSentTo($user, VerifyEmailNotification::class, function (VerifyEmailNotification $notification) use (&$token): bool {
            parse_str((string) parse_url($notification->url, PHP_URL_QUERY), $query);
            $token = (string) $query['token'];

            return true;
        });

        return $token;
    }

    private function invitationToken(string $email): string
    {
        $token = '';

        Notification::assertSentOnDemand(
            InvitationNotification::class,
            function (InvitationNotification $notification, array $channels, AnonymousNotifiable $notifiable) use ($email, &$token): bool {
                if ($notifiable->routes['mail'] !== $email) {
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
