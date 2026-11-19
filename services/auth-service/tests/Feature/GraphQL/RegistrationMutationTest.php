<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Public sign-up (open mode). Invitations are covered by InvitationTest.
 */
final class RegistrationMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const REGISTER = /** @lang GraphQL */ '
        mutation ($name: String!, $email: String!, $password: String!, $passwordConfirmation: String!, $locale: String) {
            register(name: $name, email: $email, password: $password, passwordConfirmation: $passwordConfirmation, locale: $locale) {
                email
                verified
            }
        }
    ';

    private const RESEND = /** @lang GraphQL */ '
        mutation ($email: String!) {
            resendVerificationEmail(email: $email)
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        config(['registration.mode' => 'open']);
        Notification::fake();
    }

    public function test_register_creates_an_unverified_user_and_sends_the_verification_email(): void
    {
        $this->graphQL(self::REGISTER, $this->registration())
            ->assertJsonPath('data.register.email', 'jane@example.com')
            ->assertJsonPath('data.register.verified', false);

        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();

        $this->assertNull($user->email_verified_at);
        $this->assertSame('fr', $user->locale);
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_register_stores_the_email_in_lowercase(): void
    {
        $this->graphQL(self::REGISTER, $this->registration(['email' => 'Jane@Example.com']));

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
    }

    public function test_register_rejects_a_taken_email(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->graphQL(self::REGISTER, $this->registration())
            ->assertGraphQLValidationKeys(['email']);
    }

    public function test_register_rejects_a_short_password_and_a_mismatched_confirmation(): void
    {
        $this->graphQL(self::REGISTER, $this->registration([
            'password' => 'short',
            'passwordConfirmation' => 'something-else',
        ]))->assertGraphQLValidationKeys(['password', 'passwordConfirmation']);
    }

    public function test_register_is_refused_when_registration_is_closed(): void
    {
        config(['registration.mode' => 'closed']);

        $this->graphQL(self::REGISTER, $this->registration())
            ->assertJsonPath('errors.0.extensions.code', 'REGISTRATION_DISABLED');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_resend_sends_a_new_link_and_invalidates_the_previous_one(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        $firstToken = $this->sentToken($user);

        $this->graphQL(self::RESEND, ['email' => 'jane@example.com'])
            ->assertJsonPath('data.resendVerificationEmail', true);

        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 2);
        $this->postJson('/auth/verify-email', ['token' => $firstToken])
            ->assertStatus(400)
            ->assertJsonPath('code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_resend_is_limited_to_three_emails_per_hour(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();

        foreach (range(1, 4) as $attempt) {
            $this->graphQL(self::RESEND, ['email' => 'jane@example.com'])
                ->assertJsonPath('data.resendVerificationEmail', true);
        }

        // 1 at sign-up + 3 resends: the 4th resend is silently ignored.
        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 4);
    }

    public function test_resend_answers_true_for_an_unknown_email_without_sending_anything(): void
    {
        $this->graphQL(self::RESEND, ['email' => 'nobody@example.com'])
            ->assertJsonPath('data.resendVerificationEmail', true);

        Notification::assertNothingSent();
    }

    /**
     * @param  array<string, string>  $overrides
     * @return array<string, string>
     */
    private function registration(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'a-long-enough-password',
            'passwordConfirmation' => 'a-long-enough-password',
            'locale' => 'fr',
        ], $overrides);
    }

    /**
     * Reads the token from the link of the last verification email, as the user would.
     */
    private function sentToken(User $user): string
    {
        $token = '';

        Notification::assertSentTo($user, VerifyEmailNotification::class, function (VerifyEmailNotification $notification) use (&$token): bool {
            parse_str((string) parse_url($notification->url, PHP_URL_QUERY), $query);
            $token = (string) $query['token'];

            return true;
        });

        return $token;
    }
}
