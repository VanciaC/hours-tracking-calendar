<?php declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Exceptions\InvalidDateRangeException;
use App\Repositories\Contracts\WorkDayRepositoryInterface;
use App\Services\WorkDayService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

final class WorkDayServiceTest extends TestCase
{
    public function test_it_returns_the_work_days_found_by_the_repository(): void
    {
        $from = Carbon::parse('2026-11-01');
        $to = Carbon::parse('2026-11-30');
        $expected = new Collection();

        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findByUserBetween')
            ->with(1, $from, $to)
            ->willReturn($expected);

        $service = new WorkDayService($repository);

        $this->assertSame($expected, $service->getUserWorkDaysBetween(1, $from, $to));
    }

    public function test_it_accepts_a_single_day_period(): void
    {
        $day = Carbon::parse('2026-11-10');

        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findByUserBetween')
            ->willReturn(new Collection());

        (new WorkDayService($repository))->getUserWorkDaysBetween(1, $day, $day);
    }

    public function test_it_rejects_a_period_ending_before_it_starts(): void
    {
        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->never())->method('findByUserBetween');

        $this->expectException(InvalidDateRangeException::class);

        (new WorkDayService($repository))->getUserWorkDaysBetween(
            1,
            Carbon::parse('2026-11-30'),
            Carbon::parse('2026-11-01'),
        );
    }
}