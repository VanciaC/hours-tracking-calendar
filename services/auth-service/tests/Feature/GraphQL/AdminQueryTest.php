<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class AdminQueryTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const USERS = /** @lang GraphQL */ '
        query ($search: String, $page: Int!, $perPage: Int!) {
            adminUsers(search: $search, page: $page, perPage: $perPage) {
                items { id name email role }
                total
                page
                lastPage
            }
        }
    ';

    private const USER = /** @lang GraphQL */ '
        query ($id: ID!) {
            adminUser(id: $id) { id email emailVerifiedAt createdAt }
        }
    ';

    public function test_an_admin_lists_regular_users_by_name_and_never_admins(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Admin']);
        User::factory()->admin()->create(['name' => 'Another admin']);
        User::factory()->create(['name' => 'Zoe']);
        User::factory()->create(['name' => 'Alice']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::USERS, ['page' => 1, 'perPage' => 20])
            ->assertJsonPath('data.adminUsers.total', 2)
            ->assertJsonPath('data.adminUsers.items.0.name', 'Alice')
            ->assertJsonPath('data.adminUsers.items.1.name', 'Zoe')
            ->assertJsonPath('data.adminUsers.items.0.role', 'USER');
    }

    public function test_an_admin_searches_on_name_or_email(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Alice', 'email' => 'alice@example.com']);
        User::factory()->create(['name' => 'Bob', 'email' => 'bob@work.test']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::USERS, ['search' => 'work.test', 'page' => 1, 'perPage' => 20])
            ->assertJsonPath('data.adminUsers.total', 1)
            ->assertJsonPath('data.adminUsers.items.0.name', 'Bob');
    }

    public function test_the_user_list_is_paginated(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(5)->create();

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::USERS, ['page' => 2, 'perPage' => 2])
            ->assertJsonPath('data.adminUsers.total', 5)
            ->assertJsonPath('data.adminUsers.page', 2)
            ->assertJsonPath('data.adminUsers.lastPage', 3)
            ->assertJsonCount(2, 'data.adminUsers.items');
    }

    public function test_a_regular_user_is_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'jwt')
            ->graphQL(self::USERS, ['page' => 1, 'perPage' => 20])
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');

        $this->actingAs($user, 'jwt')
            ->graphQL(self::USER, ['id' => (string) $user->id])
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');
    }

    public function test_an_anonymous_visitor_is_refused(): void
    {
        $this->graphQL(self::USERS, ['page' => 1, 'perPage' => 20])
            ->assertGraphQLErrorMessage('Unauthenticated.');
    }

    public function test_an_admin_gets_a_regular_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::USER, ['id' => (string) $user->id])
            ->assertJsonPath('data.adminUser.email', 'jane@example.com');
    }

    public function test_an_admin_never_gets_another_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($admin, 'jwt')
            ->graphQL(self::USER, ['id' => (string) $otherAdmin->id])
            ->assertJsonPath('data.adminUser', null);
    }
}
