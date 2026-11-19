<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Enums\Role;
use App\Models\EntryTemplate;
use App\Models\WorkDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Each company only sees its own hours.
 */
final class TenancyTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const TEAM = /** @lang GraphQL */ '
        query ($from: Date!, $to: Date!) {
            teamWorkDays(from: $from, to: $to) { userId }
        }
    ';

    public function test_the_team_schedule_only_shows_the_admin_company(): void
    {
        WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create();

        $this->actAsTenant(2);
        WorkDay::factory()->forUser(9)->onDate('2026-11-16')->create();

        $this->actingAs(new AuthenticatedUser(1, Role::Admin, tenantId: 1), 'jwt')
            ->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-16'])
            ->assertJsonCount(1, 'data.teamWorkDays')
            ->assertJsonPath('data.teamWorkDays.0.userId', '7');

        $this->actingAs(new AuthenticatedUser(2, Role::Admin, tenantId: 2), 'jwt')
            ->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-16'])
            ->assertJsonCount(1, 'data.teamWorkDays')
            ->assertJsonPath('data.teamWorkDays.0.userId', '9');
    }

    public function test_rows_of_another_company_are_invisible(): void
    {
        $this->actAsTenant(2);
        WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create();
        EntryTemplate::factory()->forUser(7)->create();

        $this->actAsTenant(1);

        $this->assertSame(0, WorkDay::query()->count());
        $this->assertSame(0, EntryTemplate::query()->count());
    }

    public function test_new_rows_belong_to_the_current_company(): void
    {
        $this->actAsTenant(5);

        $workDay = WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create();

        $this->assertSame(5, $workDay->tenant_id);
    }
}
