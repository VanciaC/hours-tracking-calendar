<?php

declare(strict_types=1);

namespace Tests\Unit\Auth;

use App\Auth\JwtUserResolver;
use App\Auth\JwtVerifier;
use App\Enums\Role;
use App\Tenancy\RequestTenant;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

final class JwtVerifierTest extends TestCase
{
    private const ISSUER = 'auth-service';

    private static string $privateKey;

    private static string $publicKeyPath;

    public static function setUpBeforeClass(): void
    {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $path = tempnam(sys_get_temp_dir(), 'jwt');

        if ($key === false || $path === false || ! openssl_pkey_export($key, $privateKey)) {
            self::fail('Unable to generate a test RSA key.');
        }

        $details = openssl_pkey_get_details($key);

        if ($details === false) {
            self::fail('Unable to read the test public key.');
        }

        file_put_contents($path, $details['key']);

        self::$privateKey = $privateKey;
        self::$publicKeyPath = $path;
    }

    public static function tearDownAfterClass(): void
    {
        @unlink(self::$publicKeyPath);
    }

    public function test_it_reads_the_user_id_and_the_admin_role(): void
    {
        $verified = $this->verifier()->verify($this->token(['sub' => '7', 'role' => 'admin']));

        $this->assertNotNull($verified);
        $this->assertSame(7, $verified->userId);
        $this->assertSame(Role::Admin, $verified->role);
    }

    public function test_it_reads_the_company(): void
    {
        $verified = $this->verifier()->verify($this->token(['sub' => '7', 'tid' => 4, 'tenant' => 'dupont']));

        $this->assertSame(4, $verified?->tenantId);
        $this->assertSame('dupont', $verified?->tenantSlug);
    }

    public function test_a_token_without_role_is_a_regular_user(): void
    {
        $verified = $this->verifier()->verify($this->token(['sub' => '7']));

        $this->assertSame(Role::User, $verified?->role);
    }

    public function test_an_unknown_role_falls_back_to_a_regular_user(): void
    {
        $verified = $this->verifier()->verify($this->token(['sub' => '7', 'role' => 'superadmin']));

        $this->assertSame(Role::User, $verified?->role);
    }

    public function test_a_token_without_company_is_refused(): void
    {
        // Without it, nothing could limit the data to the user's company.
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7'], without: 'tid')));
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7'], without: 'tenant')));
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7', 'tid' => '1'])));
    }

    public function test_a_token_from_another_issuer_is_refused(): void
    {
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7', 'iss' => 'someone-else'])));
    }

    public function test_an_expired_token_is_refused(): void
    {
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7', 'exp' => time() - 60])));
    }

    public function test_a_token_works_on_its_own_company_address(): void
    {
        $user = $this->resolver()($this->request('acme.localhost', $this->token(['sub' => '7'])));

        $this->assertSame(7, $user?->id);
        $this->assertSame(1, $user?->tenantId);
    }

    public function test_a_token_finds_nobody_on_another_company_address(): void
    {
        $this->assertNull($this->resolver()($this->request('globex.localhost', $this->token(['sub' => '7']))));
    }

    public function test_a_token_finds_nobody_outside_a_company_address(): void
    {
        $this->assertNull($this->resolver()($this->request('localhost', $this->token(['sub' => '7']))));
    }

    public function test_behind_a_proxy_the_browser_address_is_read_from_x_forwarded_host(): void
    {
        // The service itself is called as planning-service:8000, the browser asked for acme.localhost.
        $request = $this->request('planning-service', $this->token(['sub' => '7']));
        $request->headers->set('X-Forwarded-Host', 'acme.localhost:5173');

        $this->assertSame(7, $this->resolver()($request)?->id);
    }

    private function verifier(): JwtVerifier
    {
        return new JwtVerifier(self::$publicKeyPath, self::ISSUER);
    }

    private function resolver(): JwtUserResolver
    {
        return new JwtUserResolver($this->verifier(), new RequestTenant('localhost'));
    }

    private function request(string $host, string $token): Request
    {
        $request = Request::create("http://{$host}/graphql", 'POST');
        $request->headers->set('Authorization', 'Bearer '.$token);

        return $request;
    }

    /**
     * @param  array<string, mixed>  $claims  override the defaults (iss, exp, tid, tenant)
     * @param  string|null  $without  a default claim to leave out
     */
    private function token(array $claims, ?string $without = null): string
    {
        $claims += ['iss' => self::ISSUER, 'exp' => time() + 60, 'tid' => 1, 'tenant' => 'acme'];

        if ($without !== null) {
            unset($claims[$without]);
        }

        return JWT::encode($claims, self::$privateKey, 'RS256');
    }
}
