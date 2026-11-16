<?php declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Models\Shift;
use App\Models\WorkDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class WorkDayMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const SAVE = /** @lang GraphQL */ '
        mutation ($input: SaveWorkDayInput!) {
            saveWorkDay(input: $input) {
                id
                durationMinutes
                shifts { startTime endTime unpaidBreakMinutes }
            }
        }
    ';

    private const DELETE = /** @lang GraphQL */ '
        mutation ($id: ID!) {
            deleteWorkDay(id: $id) { id }
        }
    ';

    private const SAVE_MANY = /** @lang GraphQL */ '
        mutation ($dates: [Date!]!, $hours: WorkDayHoursInput!) {
            saveWorkDays(dates: $dates, hours: $hours) {
                date
                durationMinutes
            }
        }
    ';

    public function test_it_records_a_day_in_slots_mode_with_its_net_duration(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $this->graphQL(self::SAVE, ['input' => [
            'date' => '2026-11-16',
            'mode' => 'SLOTS',
            'shifts' => [['startTime' => '08:00', 'endTime' => '15:00']],
        ]])
            ->assertJsonPath('data.saveWorkDay.durationMinutes', 420)
            ->assertJsonPath('data.saveWorkDay.shifts.0.unpaidBreakMinutes', 0);

        $this->assertDatabaseHas('work_days', ['user_id' => 7, 'date' => '2026-11-16', 'duration_minutes' => 420]);
    }

    public function test_saving_the_same_date_again_replaces_the_day_and_its_shifts(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $this->graphQL(self::SAVE, ['input' => [
            'date' => '2026-11-16',
            'mode' => 'SLOTS',
            'shifts' => [
                ['startTime' => '08:00', 'endTime' => '12:00'],
                ['startTime' => '13:00', 'endTime' => '17:00'],
            ],
        ]]);

        $this->graphQL(self::SAVE, ['input' => [
            'date' => '2026-11-16',
            'mode' => 'DURATION',
            'durationMinutes' => 300,
        ]])->assertJsonPath('data.saveWorkDay.durationMinutes', 300);

        $this->assertDatabaseCount('work_days', 1);
        $this->assertDatabaseCount('shifts', 0);
    }

    public function test_it_rejects_anonymous_requests(): void
    {
        $this->graphQL(self::SAVE, ['input' => [
            'date' => '2026-11-16',
            'mode' => 'DURATION',
            'durationMinutes' => 300,
        ]])->assertGraphQLErrorMessage('Unauthenticated.');

        $this->assertDatabaseCount('work_days', 0);
    }

    public function test_it_deletes_an_own_day(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');
        $workDay = WorkDay::factory()->forUser(7)->create();

        $this->graphQL(self::DELETE, ['id' => $workDay->id])
            ->assertJsonPath('data.deleteWorkDay.id', (string) $workDay->id);

        $this->assertModelMissing($workDay);
    }

    public function test_it_does_not_delete_someone_else_day(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');
        $workDay = WorkDay::factory()->forUser(8)->create();

        $this->graphQL(self::DELETE, ['id' => $workDay->id])
            ->assertGraphQLErrorMessage("Work day {$workDay->id} not found.");

        $this->assertModelExists($workDay);
    }

    public function test_it_records_the_same_hours_on_several_days(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');
        WorkDay::factory()->forUser(7)->onDate('2026-11-17')->withDuration(60)->create();

        $this->graphQL(self::SAVE_MANY, [
            'dates' => ['2026-11-16', '2026-11-17', '2026-11-18'],
            'hours' => ['mode' => 'SLOTS', 'shifts' => [['startTime' => '08:00', 'endTime' => '15:00']]],
        ])
            ->assertJsonCount(3, 'data.saveWorkDays')
            ->assertJsonPath('data.saveWorkDays.1.durationMinutes', 420);

        // The day already recorded on the 17th is replaced, not duplicated.
        $this->assertDatabaseCount('work_days', 3);
        $this->assertSame(3, Shift::query()->count());
    }

    public function test_it_saves_no_day_when_the_hours_are_invalid(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $this->graphQL(self::SAVE_MANY, [
            'dates' => ['2026-11-16', '2026-11-17'],
            'hours' => ['mode' => 'SLOTS', 'shifts' => [
                ['startTime' => '08:00', 'endTime' => '12:00'],
                ['startTime' => '11:00', 'endTime' => '15:00'],
            ]],
        ])->assertGraphQLErrorMessage('Shifts must not overlap.');

        $this->assertDatabaseCount('work_days', 0);
    }

    public function test_it_refuses_more_than_62_days(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $dates = array_map(
            static fn (int $offset): string => Carbon::parse('2026-01-01')->addDays($offset)->toDateString(),
            range(0, 62),
        );

        $this->graphQL(self::SAVE_MANY, [
            'dates' => $dates,
            'hours' => ['mode' => 'DURATION', 'durationMinutes' => 60],
        ])->assertGraphQLValidationKeys(['dates']);

        $this->assertDatabaseCount('work_days', 0);
    }
}
