<?php

declare(strict_types=1);

namespace Tests\Unit\Auth;

use App\Auth\JwtVerifier;
use App\Enums\Role;
use Firebase\JWT\JWT;
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

    public function test_a_token_from_another_issuer_is_refused(): void
    {
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7', 'iss' => 'someone-else'])));
    }

    public function test_an_expired_token_is_refused(): void
    {
        $this->assertNull($this->verifier()->verify($this->token(['sub' => '7', 'exp' => time() - 60])));
    }

    private function verifier(): JwtVerifier
    {
        return new JwtVerifier(self::$publicKeyPath, self::ISSUER);
    }

    /**
     * @param  array<string, mixed>  $claims  override the defaults (iss, exp)
     */
    private function token(array $claims): string
    {
        return JWT::encode($claims + ['iss' => self::ISSUER, 'exp' => time() + 60], self::$privateKey, 'RS256');
    }
}
