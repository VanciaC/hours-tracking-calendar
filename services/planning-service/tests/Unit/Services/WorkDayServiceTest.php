<?php declare(strict_types=1);

namespace Tests\Unit\Services;

use App\DataTransferObjects\ShiftData;
use App\Exceptions\InvalidDateRangeException;
use App\Exceptions\InvalidWorkDayException;
use App\Models\WorkDay;
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

    public function test_duration_mode_keeps_the_typed_duration_and_no_shift(): void
    {
        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('saveDay')
            ->with(1, $this->anything(), WorkDay::MODE_DURATION, 450, [], null)
            ->willReturn(new WorkDay());

        (new WorkDayService($repository))->saveDay(
            1, Carbon::parse('2026-11-16'), WorkDay::MODE_DURATION, 450, [new ShiftData('08:00', '09:00')], null,
        );
    }

    public function test_slots_mode_counts_a_paid_break_as_worked_time(): void
    {
        // 8:00 -> 15:00 with no unpaid break: 7 hours paid.
        $this->assertSlotsGiveMinutes(420, [new ShiftData('08:00', '15:00')]);
    }

    public function test_slots_mode_deducts_unpaid_breaks_and_sums_the_shifts(): void
    {
        // 4h + (4h30 - 30 min) = 8h, typed afternoon first.
        $this->assertSlotsGiveMinutes(480, [
            new ShiftData('13:00', '17:30', 30),
            new ShiftData('08:00', '12:00'),
        ]);
    }

    public function test_it_rejects_a_shift_ending_before_it_starts(): void
    {
        $this->assertSlotsRejected('Shift 15:00-08:00 must end after it starts.', [new ShiftData('15:00', '08:00')]);
    }

    public function test_it_rejects_overlapping_shifts(): void
    {
        $this->assertSlotsRejected('Shifts must not overlap.', [
            new ShiftData('11:00', '15:00'),
            new ShiftData('08:00', '12:00'),
        ]);
    }

    public function test_it_rejects_an_unpaid_break_as_long_as_the_shift(): void
    {
        $this->assertSlotsRejected(
            'The unpaid break of shift 08:00-09:00 must be shorter than the shift.',
            [new ShiftData('08:00', '09:00', 60)],
        );
    }

    public function test_it_rejects_slots_mode_without_any_shift(): void
    {
        $this->assertSlotsRejected('Add at least one shift.', []);
    }

    public function test_it_rejects_a_duration_out_of_a_day(): void
    {
        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->never())->method('saveDay');

        $this->expectException(InvalidWorkDayException::class);

        (new WorkDayService($repository))->saveDay(
            1, Carbon::parse('2026-11-16'), WorkDay::MODE_DURATION, 0, [], null,
        );
    }

    /**
     * @param list<ShiftData> $shifts
     */
    private function assertSlotsGiveMinutes(int $expectedMinutes, array $shifts): void
    {
        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('saveDay')
            ->with(1, $this->anything(), WorkDay::MODE_SLOTS, $expectedMinutes, $this->anything(), null)
            ->willReturn(new WorkDay());

        (new WorkDayService($repository))->saveDay(
            1, Carbon::parse('2026-11-16'), WorkDay::MODE_SLOTS, null, $shifts, null,
        );
    }

    /**
     * @param list<ShiftData> $shifts
     */
    private function assertSlotsRejected(string $expectedMessage, array $shifts): void
    {
        $repository = $this->createMock(WorkDayRepositoryInterface::class);
        $repository->expects($this->never())->method('saveDay');

        $this->expectException(InvalidWorkDayException::class);
        $this->expectExceptionMessage($expectedMessage);

        (new WorkDayService($repository))->saveDay(
            1, Carbon::parse('2026-11-16'), WorkDay::MODE_SLOTS, null, $shifts, null,
        );
    }
}