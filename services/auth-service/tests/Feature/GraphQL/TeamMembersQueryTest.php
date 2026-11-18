<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class TeamMembersQueryTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const TEAM_MEMBERS = /** @lang GraphQL */ '
        query {
            teamMembers { id name role }
        }
    ';

    public function test_an_admin_gets_every_verified_account_admins_included_by_name(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Zoé Admin']);
        User::factory()->create(['name' => 'Bruno']);
        User::factory()->admin()->create(['name' => 'Alice']);
        User::factory()->unverified()->create(['name' => 'Claire']);

        $this->actingAs($admin, 'jwt');

        $this->graphQL(self::TEAM_MEMBERS)
            ->assertJsonCount(3, 'data.teamMembers')
            ->assertJsonPath('data.teamMembers.0.name', 'Alice')
            ->assertJsonPath('data.teamMembers.0.role', 'ADMIN')
            ->assertJsonPath('data.teamMembers.1.name', 'Bruno')
            ->assertJsonPath('data.teamMembers.2.name', 'Zoé Admin');
    }

    public function test_a_regular_user_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create(), 'jwt');

        $this->graphQL(self::TEAM_MEMBERS)
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');
    }

    public function test_an_anonymous_visitor_is_refused(): void
    {
        $this->graphQL(self::TEAM_MEMBERS)
            ->assertGraphQLErrorMessage('Unauthenticated.');
    }
}
