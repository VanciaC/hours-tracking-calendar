<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\RefreshToken;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class PasswordResetTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const REQUEST = /** @lang GraphQL */ '
        mutation ($email: String!) {
            requestPasswordReset(email: $email)
        }
    ';

    private const RESET = /** @lang GraphQL */ '
        mutation ($token: String!, $password: String!, $passwordConfirmation: String!) {
            resetPassword(token: $token, password: $password, passwordConfirmation: $passwordConfirmation)
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_a_verified_user_receives_a_link_whose_token_is_stored_hashed(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->graphQL(self::REQUEST, ['email' => 'Ana@Example.com'])
            ->assertJsonPath('data.requestPasswordReset', true);

        $token = $this->sentTokens($user)[0];

        $this->assertDatabaseHas('password_reset_tokens', ['user_id' => $user->id, 'token_hash' => hash('sha256', $token)]);
        $this->assertDatabaseMissing('password_reset_tokens', ['token_hash' => $token]);
    }

    public function test_unknown_and_unverified_addresses_get_the_same_answer_without_any_email(): void
    {
        User::factory()->unverified()->create(['email' => 'new@example.com']);

        $this->graphQL(self::REQUEST, ['email' => 'nobody@example.com'])
            ->assertJsonPath('data.requestPasswordReset', true);
        $this->graphQL(self::REQUEST, ['email' => 'new@example.com'])
            ->assertJsonPath('data.requestPasswordReset', true);

        Notification::assertNothingSent();
    }

    public function test_requests_are_limited_to_three_per_hour(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);

        foreach (range(1, 4) as $attempt) {
            $this->graphQL(self::REQUEST, ['email' => 'ana@example.com'])
                ->assertJsonPath('data.requestPasswordReset', true);
        }

        Notification::assertSentToTimes($user, ResetPasswordNotification::class, 3);
    }

    public function test_the_reset_changes_the_password_and_signs_out_every_session(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com', 'password' => 'old-password']);

        // An open session, through the real sign-in endpoint.
        $this->postJson('/auth/login', ['email' => 'ana@example.com', 'password' => 'old-password'])->assertOk();
        $this->assertSame(1, RefreshToken::query()->whereNull('revoked_at')->count());

        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);

        $this->graphQL(self::RESET, [
            'token' => $this->sentTokens($user)[0],
            'password' => 'new-password',
            'passwordConfirmation' => 'new-password',
        ])->assertJsonPath('data.resetPassword', true);

        $this->assertTrue(Hash::check('new-password', $user->fresh()?->password ?? ''));
        $this->assertSame(0, RefreshToken::query()->whereNull('revoked_at')->count());
    }

    public function test_a_link_works_only_once(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);
        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);
        $token = $this->sentTokens($user)[0];

        $this->graphQL(self::RESET, $this->newPassword($token))->assertJsonPath('data.resetPassword', true);

        $this->graphQL(self::RESET, $this->newPassword($token))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_RESET_TOKEN');
    }

    public function test_a_new_request_invalidates_the_previous_link(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);
        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);
        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);
        [$first, $second] = $this->sentTokens($user);

        $this->graphQL(self::RESET, $this->newPassword($first))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_RESET_TOKEN');
        $this->graphQL(self::RESET, $this->newPassword($second))
            ->assertJsonPath('data.resetPassword', true);
    }

    public function test_an_expired_link_is_refused(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);
        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);
        $token = $this->sentTokens($user)[0];

        $this->travel(61)->minutes();

        $this->graphQL(self::RESET, $this->newPassword($token))
            ->assertJsonPath('errors.0.extensions.code', 'INVALID_RESET_TOKEN');
    }

    public function test_the_new_password_is_validated(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);
        $this->graphQL(self::REQUEST, ['email' => 'ana@example.com']);
        $token = $this->sentTokens($user)[0];

        $this->graphQL(self::RESET, ['token' => $token, 'password' => 'short', 'passwordConfirmation' => 'short'])
            ->assertGraphQLValidationKeys(['password']);

        $this->graphQL(self::RESET, ['token' => $token, 'password' => 'new-password', 'passwordConfirmation' => 'other-one'])
            ->assertGraphQLValidationKeys(['passwordConfirmation']);
    }

    /**
     * Tokens of the links emailed to the user, in sending order.
     *
     * @return list<string>
     */
    private function sentTokens(User $user): array
    {
        $tokens = [];

        Notification::assertSentTo(
            $user,
            ResetPasswordNotification::class,
            function (ResetPasswordNotification $notification) use (&$tokens): bool {
                parse_str((string) parse_url($notification->url, PHP_URL_QUERY), $query);
                $tokens[] = (string) ($query['token'] ?? '');

                return true;
            },
        );

        return $tokens;
    }

    /**
     * @return array{token: string, password: string, passwordConfirmation: string}
     */
    private function newPassword(string $token): array
    {
        return ['token' => $token, 'password' => 'new-password', 'passwordConfirmation' => 'new-password'];
    }
}
