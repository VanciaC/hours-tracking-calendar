<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class RegistrationMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const REGISTER = /** @lang GraphQL */ '
        mutation ($name: String!, $email: String!, $password: String!, $passwordConfirmation: String!, $locale: String) {
            register(name: $name, email: $email, password: $password, passwordConfirmation: $passwordConfirmation, locale: $locale) {
                email
            }
        }
    ';

    private const VERIFY = /** @lang GraphQL */ '
        mutation ($token: String!) {
            verifyEmail(token: $token) {
                accessToken
                user { email }
            }
        }
    ';

    private const RESEND = /** @lang GraphQL */ '
        mutation ($email: String!) {
            resendVerificationEmail(email: $email)
        }
    ';

    private const LOGIN = /** @lang GraphQL */ '
        mutation ($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                accessToken
            }
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_register_creates_an_unverified_user_and_sends_the_verification_email(): void
    {
        $this->graphQL(self::REGISTER, $this->registration())
            ->assertJsonPath('data.register.email', 'jane@example.com');

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
            'password' => 'too-short',
            'passwordConfirmation' => 'something-else',
        ]))->assertGraphQLValidationKeys(['password', 'passwordConfirmation']);
    }

    public function test_register_is_refused_when_registration_is_disabled(): void
    {
        config(['registration.enabled' => false]);

        $this->graphQL(self::REGISTER, $this->registration())
            ->assertJsonPath('errors.0.extensions.code', 'REGISTRATION_DISABLED');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_verify_email_verifies_the_account_and_logs_the_user_in(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();

        $this->graphQL(self::VERIFY, ['token' => $this->sentToken($user)])
            ->assertJsonPath('data.verifyEmail.user.email', 'jane@example.com')
            ->assertJsonStructure(['data' => ['verifyEmail' => ['accessToken']]]);

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_a_verification_link_works_only_once(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $token = $this->sentToken(User::query()->where('email', 'jane@example.com')->firstOrFail());

        $this->graphQL(self::VERIFY, ['token' => $token]);

        $this->graphQL(self::VERIFY, ['token' => $token])
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_an_expired_verification_link_is_refused(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $token = $this->sentToken(User::query()->where('email', 'jane@example.com')->firstOrFail());

        $this->travel(25)->hours();

        $this->graphQL(self::VERIFY, ['token' => $token])
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_resend_sends_a_new_link_and_invalidates_the_previous_one(): void
    {
        $this->graphQL(self::REGISTER, $this->registration());
        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        $firstToken = $this->sentToken($user);

        $this->graphQL(self::RESEND, ['email' => 'jane@example.com'])
            ->assertJsonPath('data.resendVerificationEmail', true);

        Notification::assertSentToTimes($user, VerifyEmailNotification::class, 2);
        $this->graphQL(self::VERIFY, ['token' => $firstToken])
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_resend_answers_true_for_an_unknown_email_without_sending_anything(): void
    {
        $this->graphQL(self::RESEND, ['email' => 'nobody@example.com'])
            ->assertJsonPath('data.resendVerificationEmail', true);

        Notification::assertNothingSent();
    }

    public function test_login_is_refused_until_the_email_is_verified(): void
    {
        User::factory()->unverified()->create(['email' => 'jane@example.com']);

        $this->graphQL(self::LOGIN, ['email' => 'jane@example.com', 'password' => 'password'])
            ->assertJsonPath('errors.0.extensions.code', 'EMAIL_NOT_VERIFIED');
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
