<?php declare(strict_types=1);

namespace Tests\Feature\Repositories;

use App\Models\WorkDay;
use App\Repositories\WorkDayRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Enumerable;
use Tests\TestCase;

final class WorkDayRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private WorkDayRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->app->make(WorkDayRepository::class);
    }

    public function test_it_returns_only_the_user_work_days_within_the_period_ordered_by_date(): void
    {
        WorkDay::factory()->forUser(1)->onDate('2026-11-20')->create();
        WorkDay::factory()->forUser(1)->onDate('2026-11-05')->create();
        WorkDay::factory()->forUser(1)->onDate('2026-12-01')->create(); // outside the period
        WorkDay::factory()->forUser(2)->onDate('2026-11-10')->create(); // another user

        $workDays = $this->repository->findByUserBetween(
            1,
            Carbon::parse('2026-11-01'),
            Carbon::parse('2026-11-30'),
        );

        $this->assertSame(['2026-11-05', '2026-11-20'], $this->datesOf($workDays));
    }

    public function test_period_bounds_are_inclusive(): void
    {
        WorkDay::factory()->forUser(1)->onDate('2026-11-01')->create();
        WorkDay::factory()->forUser(1)->onDate('2026-11-30')->create();

        $workDays = $this->repository->findByUserBetween(
            1,
            Carbon::parse('2026-11-01'),
            Carbon::parse('2026-11-30'),
        );

        $this->assertSame(['2026-11-01', '2026-11-30'], $this->datesOf($workDays));
    }

    public function test_it_returns_an_empty_collection_when_nothing_matches(): void
    {
        WorkDay::factory()->forUser(2)->onDate('2026-11-10')->create();

        $workDays = $this->repository->findByUserBetween(
            1,
            Carbon::parse('2026-11-01'),
            Carbon::parse('2026-11-30'),
        );

        $this->assertTrue($workDays->isEmpty());
    }

    /**
     * @param  Enumerable<int, WorkDay>  $workDays
     *
     * @return list<string>
     */
    private function datesOf(Enumerable $workDays): array
    {
        return $workDays
            ->map(fn (WorkDay $workDay): string => $workDay->date->toDateString())
            ->values()
            ->all();
    }
}