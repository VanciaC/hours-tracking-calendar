<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Services\RegistrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

final class SessionTest extends TestCase
{
    use RefreshDatabase;

    private const COOKIE = 'htc_refresh';

    public function test_login_returns_a_short_access_token_and_sets_a_protected_refresh_cookie(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->login('jane@example.com', 'password')
            ->assertOk()
            ->assertJsonStructure(['accessToken', 'tokenType', 'expiresIn'])
            ->assertJsonPath('expiresIn', 15 * 60);

        $cookie = $response->getCookie(self::COOKIE, false);
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('/auth', $cookie->getPath());
        $this->assertSame('strict', $cookie->getSameSite());
    }

    public function test_login_is_case_insensitive_on_the_email(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->login('Jane@Example.com', 'password')->assertOk();
    }

    public function test_login_with_wrong_credentials_gives_a_generic_error(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->login('jane@example.com', 'wrong-password')
            ->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');

        $this->login('nobody@example.com', 'password')
            ->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');
    }

    public function test_login_is_refused_until_the_email_is_verified(): void
    {
        User::factory()->unverified()->create(['email' => 'jane@example.com']);

        $this->login('jane@example.com', 'password')
            ->assertStatus(403)
            ->assertJsonPath('code', 'EMAIL_NOT_VERIFIED');
    }

    public function test_login_is_blocked_after_five_failures_in_a_minute(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        foreach (range(1, 5) as $attempt) {
            $this->login('jane@example.com', 'wrong-password')->assertStatus(401);
        }

        // Even the right password is refused while blocked.
        $this->login('jane@example.com', 'password')
            ->assertStatus(429)
            ->assertJsonPath('code', 'TOO_MANY_ATTEMPTS')
            ->assertHeader('Retry-After');

        $this->travel(61)->seconds();

        $this->login('jane@example.com', 'password')->assertOk();
    }

    public function test_login_only_accepts_json(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        // A classic HTML form post, as a CSRF attack would send.
        $this->post('/auth/login', ['email' => 'jane@example.com', 'password' => 'password'])
            ->assertStatus(415);
    }

    public function test_refresh_rotates_the_refresh_token(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $first = $this->refreshTokenOf($this->login('jane@example.com', 'password'));

        $response = $this->refreshWith($first)
            ->assertOk()
            ->assertJsonStructure(['accessToken', 'expiresIn']);

        $this->assertNotSame($first, $this->refreshTokenOf($response));
    }

    public function test_reusing_an_old_refresh_token_revokes_the_whole_session(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $stolen = $this->refreshTokenOf($this->login('jane@example.com', 'password'));
        $current = $this->refreshTokenOf($this->refreshWith($stolen));

        $this->travel(11)->seconds();

        $this->refreshWith($stolen)
            ->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_REFRESH_TOKEN');

        // The legitimate token of the same session is revoked too.
        $this->refreshWith($current)->assertStatus(401);
    }

    public function test_two_tabs_refreshing_at_the_same_time_keep_their_session(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $shared = $this->refreshTokenOf($this->login('jane@example.com', 'password'));

        $this->refreshWith($shared)->assertOk();
        $this->refreshWith($shared)->assertOk();
    }

    public function test_refresh_without_cookie_is_refused(): void
    {
        $this->postJson('/auth/refresh')
            ->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_REFRESH_TOKEN');
    }

    public function test_an_expired_refresh_token_is_refused(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $token = $this->refreshTokenOf($this->login('jane@example.com', 'password'));

        $this->travel(31)->days();

        $this->refreshWith($token)->assertStatus(401);
    }

    public function test_logout_revokes_the_session_and_removes_the_cookie(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        $token = $this->refreshTokenOf($this->login('jane@example.com', 'password'));

        $response = $this->withCredentials()
            ->withUnencryptedCookie(self::COOKIE, $token)
            ->postJson('/auth/logout')
            ->assertNoContent();

        $this->assertSame('', $response->getCookie(self::COOKIE, false)?->getValue() ?? '');
        $this->refreshWith($token)->assertStatus(401);
    }

    public function test_verify_email_verifies_the_account_and_signs_the_user_in(): void
    {
        $user = $this->unverifiedUserWithLink();

        $response = $this->postJson('/auth/verify-email', ['token' => $this->sentToken($user)])
            ->assertOk()
            ->assertJsonStructure(['accessToken', 'expiresIn']);

        $this->assertNotNull($response->getCookie(self::COOKIE, false));
        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_a_verification_link_works_only_once(): void
    {
        $token = $this->sentToken($this->unverifiedUserWithLink());

        $this->postJson('/auth/verify-email', ['token' => $token])->assertOk();

        $this->postJson('/auth/verify-email', ['token' => $token])
            ->assertStatus(400)
            ->assertJsonPath('code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_an_expired_verification_link_is_refused(): void
    {
        $token = $this->sentToken($this->unverifiedUserWithLink());

        $this->travel(25)->hours();

        $this->postJson('/auth/verify-email', ['token' => $token])
            ->assertStatus(400)
            ->assertJsonPath('code', 'INVALID_VERIFICATION_TOKEN');
    }

    public function test_the_access_token_carries_the_role(): void
    {
        User::factory()->admin()->create(['email' => 'boss@example.com']);

        $accessToken = (string) $this->login('boss@example.com', 'password')->json('accessToken');

        // The payload is the second, base64url-encoded part of the JWT.
        $payload = json_decode((string) base64_decode(strtr(explode('.', $accessToken)[1], '-_', '+/')), true);
        $this->assertSame('admin', $payload['role']);
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function login(string $email, string $password): TestResponse
    {
        return $this->postJson('/auth/login', ['email' => $email, 'password' => $password]);
    }

    /**
     * Sends the refresh cookie, as the browser does: JSON test requests carry no cookie by default.
     *
     * @return TestResponse<JsonResponse>
     */
    private function refreshWith(string $refreshToken): TestResponse
    {
        return $this->withCredentials()
            ->withUnencryptedCookie(self::COOKIE, $refreshToken)
            ->postJson('/auth/refresh');
    }

    /**
     * @param  TestResponse<JsonResponse>  $response
     */
    private function refreshTokenOf(TestResponse $response): string
    {
        $cookie = $response->getCookie(self::COOKIE, false);
        $this->assertNotNull($cookie);

        return (string) $cookie->getValue();
    }

    private function unverifiedUserWithLink(): User
    {
        Notification::fake();
        $user = User::factory()->unverified()->create(['email' => 'jane@example.com']);
        $this->app->make(RegistrationService::class)->resendVerificationEmail('jane@example.com');

        return $user;
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
