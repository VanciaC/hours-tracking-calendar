<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use App\Models\EmailVerificationToken;
use App\Models\PasswordResetToken;
use App\Models\RefreshToken;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PruneTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_accounts_older_than_seven_days_are_deleted_with_their_links(): void
    {
        $old = User::factory()->unverified()->create(['created_at' => now()->subDays(8)]);
        $recent = User::factory()->unverified()->create(['created_at' => now()->subDays(6)]);
        $verified = User::factory()->create(['created_at' => now()->subYear()]);

        EmailVerificationToken::query()->create([
            'user_id' => $old->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => CarbonImmutable::now()->addDay(),
        ]);

        $this->artisan('model:prune')->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
        $this->assertModelExists($verified);
        $this->assertDatabaseMissing('email_verification_tokens', ['user_id' => $old->id]);
    }

    public function test_expired_and_used_links_are_deleted_but_valid_ones_are_kept(): void
    {
        $user = User::factory()->create();

        $expired = PasswordResetToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => CarbonImmutable::now()->subMinute(),
        ]);
        $used = PasswordResetToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => str_repeat('b', 64),
            'expires_at' => CarbonImmutable::now()->addHour(),
        ]);
        $used->forceFill(['used_at' => CarbonImmutable::now()])->save();
        $valid = PasswordResetToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => str_repeat('c', 64),
            'expires_at' => CarbonImmutable::now()->addHour(),
        ]);

        $this->artisan('model:prune')->assertSuccessful();

        $this->assertModelMissing($expired);
        $this->assertModelMissing($used);
        $this->assertModelExists($valid);
    }

    public function test_only_expired_session_tokens_are_deleted(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com', 'password' => 'password']);

        // A real session, then the clock moves past its 30 days.
        $this->postJson('/auth/login', ['email' => 'ana@example.com', 'password' => 'password'])->assertOk();
        $this->travel(31)->days();

        // A second, fresh session.
        $this->postJson('/auth/login', ['email' => 'ana@example.com', 'password' => 'password'])->assertOk();

        $this->artisan('model:prune')->assertSuccessful();

        $this->assertSame(1, RefreshToken::query()->where('user_id', $user->id)->count());
    }
}
