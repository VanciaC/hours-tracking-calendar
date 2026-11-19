<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Sign-up by invitation (US-33).
 */
final class InvitationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const INVITE = /** @lang GraphQL */ '
        mutation ($email: String!) {
            createInvitation(email: $email) { id email status invitedBy { name } }
        }
    ';

    private const RESEND = /** @lang GraphQL */ '
        mutation ($id: ID!) {
            resendInvitation(id: $id) { id status }
        }
    ';

    private const REVOKE = /** @lang GraphQL */ '
        mutation ($id: ID!) {
            revokeInvitation(id: $id)
        }
    ';

    private const INVITATIONS = /** @lang GraphQL */ '
        query {
            invitations { email status }
        }
    ';

    private const PREVIEW = /** @lang GraphQL */ '
        query ($token: String!) {
            invitation(token: $token) { email }
        }
    ';

    private const MODE = /** @lang GraphQL */ '
        query {
            registrationMode
        }
    ';

    private const REGISTER = /** @lang GraphQL */ '
        mutation ($name: String!, $email: String!, $password: String!, $passwordConfirmation: String!, $invitationToken: String) {
            register(name: $name, email: $email, password: $password, passwordConfirmation: $passwordConfirmation, invitationToken: $invitationToken) {
                email
                verified
            }
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        config(['registration.mode' => 'invite']);
        Notification::fake();
    }

    public function test_an_admin_invites_an_address_and_the_link_is_emailed_to_it(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Vancia']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'Jane@Example.com'])
            ->assertJsonPath('data.createInvitation.email', 'jane@example.com')
            ->assertJsonPath('data.createInvitation.status', 'PENDING')
            ->assertJsonPath('data.createInvitation.invitedBy.name', 'Vancia');

        $this->assertNotSame('', $this->invitationToken('jane@example.com'));
    }

    public function test_the_invited_person_signs_up_with_a_verified_account_and_no_verification_email(): void
    {
        $token = $this->invite('jane@example.com');

        $this->graphQL(self::REGISTER, $this->registration($token))
            ->assertJsonPath('data.register.email', 'jane@example.com')
            ->assertJsonPath('data.register.verified', true);

        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();

        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull(Invitation::query()->where('email', 'jane@example.com')->value('accepted_at'));
        Notification::assertNotSentTo($user, VerifyEmailNotification::class);
    }

    public function test_the_invited_address_wins_over_the_typed_one(): void
    {
        $token = $this->invite('jane@example.com');

        $this->graphQL(self::REGISTER, $this->registration($token, 'someone-else@example.com'))
            ->assertJsonPath('data.register.email', 'jane@example.com');

        $this->assertDatabaseMissing('users', ['email' => 'someone-else@example.com']);
    }

    public function test_sign_up_without_an_invitation_is_refused_in_invite_mode(): void
    {
        $this->graphQL(self::REGISTER, $this->registration(null))
            ->assertJsonPath('errors.0.extensions.code', 'INVITATION_REQUIRED');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_an_expired_invitation_is_refused(): void
    {
        $token = $this->invite('jane@example.com');

        $this->travel(8)->days();

        $this->graphQL(self::REGISTER, $this->registration($token))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_INVITATION');

        $this->assertDatabaseCount('users', 1); // only the admin
    }

    public function test_an_invitation_only_works_once(): void
    {
        $token = $this->invite('jane@example.com');

        $this->graphQL(self::REGISTER, $this->registration($token));

        $this->graphQL(self::REGISTER, $this->registration($token, 'other@example.com'))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_INVITATION');
    }

    public function test_resending_sends_a_new_link_and_invalidates_the_previous_one(): void
    {
        $admin = User::factory()->admin()->create();
        $id = $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'jane@example.com'])
            ->json('data.createInvitation.id');
        $firstToken = $this->invitationToken('jane@example.com');

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::RESEND, ['id' => $id])
            ->assertJsonPath('data.resendInvitation.status', 'PENDING');

        $newToken = $this->invitationToken('jane@example.com');
        $this->assertNotSame($firstToken, $newToken);

        $this->graphQL(self::PREVIEW, ['token' => $firstToken])
            ->assertJsonPath('data.invitation', null);
        $this->graphQL(self::PREVIEW, ['token' => $newToken])
            ->assertJsonPath('data.invitation.email', 'jane@example.com');
    }

    public function test_a_revoked_invitation_stops_working_and_an_accepted_one_cannot_be_revoked(): void
    {
        $admin = User::factory()->admin()->create();
        $janeId = $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'jane@example.com'])
            ->json('data.createInvitation.id');
        $janeToken = $this->invitationToken('jane@example.com');

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::REVOKE, ['id' => $janeId])
            ->assertJsonPath('data.revokeInvitation', true);

        $this->graphQL(self::REGISTER, $this->registration($janeToken))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_INVITATION');

        $bobId = $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'bob@example.com'])
            ->json('data.createInvitation.id');
        $this->graphQL(self::REGISTER, $this->registration($this->invitationToken('bob@example.com'), 'bob@example.com'));

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::REVOKE, ['id' => $bobId])
            ->assertJsonPath('data.revokeInvitation', false);
    }

    public function test_an_address_that_already_has_an_account_cannot_be_invited(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['email' => 'jane@example.com']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'jane@example.com'])
            ->assertJsonPath('errors.0.extensions.code', 'EMAIL_ALREADY_REGISTERED');

        Notification::assertNothingSent();
    }

    public function test_a_regular_user_cannot_invite_nor_list_invitations(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'jane@example.com'])
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');

        $this->actingAs($user, 'jwt')
            ->graphQL(self::INVITATIONS)
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');
    }

    public function test_an_admin_lists_invitations_newest_first(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'jwt')->graphQL(self::INVITE, ['email' => 'first@example.com']);
        $this->travel(1)->minutes();
        $this->actingAs($admin, 'jwt')->graphQL(self::INVITE, ['email' => 'second@example.com']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITATIONS)
            ->assertJsonPath('data.invitations.0.email', 'second@example.com')
            ->assertJsonPath('data.invitations.1.email', 'first@example.com');
    }

    public function test_nothing_works_when_registration_is_closed(): void
    {
        $token = $this->invite('jane@example.com');
        $admin = User::factory()->admin()->create();

        config(['registration.mode' => 'closed']);

        $this->graphQL(self::REGISTER, $this->registration($token))
            ->assertJsonPath('errors.0.extensions.code', 'REGISTRATION_DISABLED');

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::INVITE, ['email' => 'bob@example.com'])
            ->assertJsonPath('errors.0.extensions.code', 'REGISTRATION_DISABLED');
    }

    public function test_the_registration_mode_is_public(): void
    {
        $this->graphQL(self::MODE)->assertJsonPath('data.registrationMode', 'INVITE');

        config(['registration.mode' => 'open']);
        $this->graphQL(self::MODE)->assertJsonPath('data.registrationMode', 'OPEN');

        // A misspelled value falls back to invitations, never to open sign-up.
        config(['registration.mode' => 'opne']);
        $this->graphQL(self::MODE)->assertJsonPath('data.registrationMode', 'INVITE');
    }

    public function test_the_preview_only_reveals_the_email_of_a_pending_invitation(): void
    {
        $token = $this->invite('jane@example.com');

        $this->graphQL(self::PREVIEW, ['token' => $token])
            ->assertJsonPath('data.invitation.email', 'jane@example.com');

        $this->graphQL(self::PREVIEW, ['token' => 'not-a-real-token'])
            ->assertJsonPath('data.invitation', null);
    }

    public function test_prune_deletes_accepted_and_long_expired_invitations_only(): void
    {
        $this->storeInvitation('pending@example.com', now()->addDays(3));
        $this->storeInvitation('recently-expired@example.com', now()->subDays(5));
        $this->storeInvitation('long-expired@example.com', now()->subDays(40));
        $this->storeInvitation('accepted@example.com', now()->addDays(3), accepted: true);

        $this->artisan('model:prune', ['--model' => [Invitation::class]])->assertSuccessful();

        $this->assertSame(
            ['pending@example.com', 'recently-expired@example.com'],
            Invitation::query()->orderBy('email')->pluck('email')->all(),
        );
    }

    /**
     * Invites the address as a new admin and returns the token of the emailed link.
     */
    private function invite(string $email): string
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'jwt')->graphQL(self::INVITE, ['email' => $email]);

        // Sign-up happens signed out, like the invited person would.
        $this->app['auth']->forgetGuards();

        return $this->invitationToken($email);
    }

    /**
     * Reads the token from the link of the last invitation emailed to the address, as the person would.
     */
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

    /**
     * @return array<string, string|null>
     */
    private function registration(?string $token, string $email = 'jane@example.com'): array
    {
        return [
            'name' => 'Jane',
            'email' => $email,
            'password' => 'a-long-enough-password',
            'passwordConfirmation' => 'a-long-enough-password',
            'invitationToken' => $token,
        ];
    }

    private function storeInvitation(string $email, \DateTimeInterface $expiresAt, bool $accepted = false): void
    {
        Invitation::query()->forceCreate([
            'email' => $email,
            'token_hash' => hash('sha256', $email),
            'expires_at' => $expiresAt,
            'accepted_at' => $accepted ? now() : null,
        ]);
    }
}
