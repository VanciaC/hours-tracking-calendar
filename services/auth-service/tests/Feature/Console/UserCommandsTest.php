<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class UserCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_create_makes_a_verified_admin_in_the_company(): void
    {
        $this->artisan('user:create', ['email' => 'Boss@Example.com', 'name' => 'Boss', '--tenant' => 'acme', '--admin' => true])
            ->expectsQuestion('Password (at least 8 characters)', 'a-strong-password')
            ->expectsQuestion('Confirm the password', 'a-strong-password')
            ->assertSuccessful();

        $user = User::query()->where('email', 'boss@example.com')->firstOrFail();
        $this->assertTrue($user->isAdmin());
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame($this->tenant->id, $user->tenant_id);
    }

    public function test_user_create_needs_an_existing_company(): void
    {
        $this->artisan('user:create', ['email' => 'boss@example.com', 'name' => 'Boss'])->assertFailed();
        $this->artisan('user:create', ['email' => 'boss@example.com', 'name' => 'Boss', '--tenant' => 'nobody'])->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_user_create_refuses_a_mismatched_password(): void
    {
        $this->artisan('user:create', ['email' => 'boss@example.com', 'name' => 'Boss', '--tenant' => 'acme'])
            ->expectsQuestion('Password (at least 8 characters)', 'a-strong-password')
            ->expectsQuestion('Confirm the password', 'something-else')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_user_promote_gives_then_removes_the_admin_role(): void
    {
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $this->artisan('user:promote', ['email' => 'jane@example.com', '--tenant' => 'acme'])->assertSuccessful();
        $this->assertTrue($user->refresh()->isAdmin());

        $this->artisan('user:promote', ['email' => 'jane@example.com', '--tenant' => 'acme', '--revoke' => true])->assertSuccessful();
        $this->assertFalse($user->refresh()->isAdmin());
    }

    public function test_user_promote_only_looks_in_the_given_company(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);
        Tenant::factory()->create(['slug' => 'globex']);

        $this->artisan('user:promote', ['email' => 'jane@example.com', '--tenant' => 'globex'])->assertFailed();
    }
}
