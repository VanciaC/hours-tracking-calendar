<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Enums\Role;
use App\Models\WorkDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class TeamQueryTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const TEAM = /** @lang GraphQL */ '
        query ($from: Date!, $to: Date!) {
            teamWorkDays(from: $from, to: $to) {
                userId
                date
                mode
                durationMinutes
                shifts { startTime endTime }
            }
        }
    ';

    public function test_an_admin_gets_every_user_days_ordered_by_date_then_user(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin), 'jwt');
        WorkDay::factory()->forUser(8)->onDate('2026-11-17')->create();
        WorkDay::factory()->forUser(7)->onDate('2026-11-17')->create();
        WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create();

        $this->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-22'])
            ->assertJsonCount(3, 'data.teamWorkDays')
            ->assertJsonPath('data.teamWorkDays.0.date', '2026-11-16')
            ->assertJsonPath('data.teamWorkDays.1.userId', '7')
            ->assertJsonPath('data.teamWorkDays.2.userId', '8');
    }

    public function test_period_bounds_are_inclusive(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin), 'jwt');
        WorkDay::factory()->forUser(7)->onDate('2026-11-15')->create();
        WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create();
        WorkDay::factory()->forUser(7)->onDate('2026-11-22')->create();
        WorkDay::factory()->forUser(7)->onDate('2026-11-23')->create();

        $this->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-22'])
            ->assertJsonCount(2, 'data.teamWorkDays');
    }

    public function test_shifts_come_with_the_days(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin), 'jwt');
        $workDay = WorkDay::factory()->forUser(7)->onDate('2026-11-16')->create(['mode' => WorkDay::MODE_SLOTS]);
        $workDay->shifts()->create(['start_time' => '13:00:00', 'end_time' => '17:00:00', 'unpaid_break_minutes' => 0]);
        $workDay->shifts()->create(['start_time' => '08:00:00', 'end_time' => '12:00:00', 'unpaid_break_minutes' => 0]);

        $this->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-16'])
            ->assertJsonPath('data.teamWorkDays.0.mode', 'SLOTS')
            ->assertJsonPath('data.teamWorkDays.0.shifts.0.startTime', '08:00:00')
            ->assertJsonPath('data.teamWorkDays.0.shifts.1.startTime', '13:00:00');
    }

    public function test_a_regular_user_is_forbidden(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');
        WorkDay::factory()->forUser(8)->onDate('2026-11-16')->create();

        $this->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-22'])
            ->assertGraphQLErrorMessage('This action is reserved to administrators.')
            ->assertJsonPath('errors.0.extensions.code', 'FORBIDDEN');
    }

    public function test_an_anonymous_visitor_is_refused(): void
    {
        $this->graphQL(self::TEAM, ['from' => '2026-11-16', 'to' => '2026-11-22'])
            ->assertGraphQLErrorMessage('Unauthenticated.');
    }

    public function test_a_reversed_period_is_refused(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin), 'jwt');

        $this->graphQL(self::TEAM, ['from' => '2026-11-22', 'to' => '2026-11-16'])
            ->assertJsonPath('data', null);
    }

    public function test_62_days_are_accepted_but_not_63(): void
    {
        $this->actingAs(new AuthenticatedUser(1, Role::Admin), 'jwt');

        // 2026-01-01 to 2026-03-03 is 62 days, bounds included.
        $this->graphQL(self::TEAM, ['from' => '2026-01-01', 'to' => '2026-03-03'])
            ->assertJsonCount(0, 'data.teamWorkDays');

        $this->graphQL(self::TEAM, ['from' => '2026-01-01', 'to' => '2026-03-04'])
            ->assertGraphQLErrorMessage('The period must not exceed 62 days.');
    }
}
