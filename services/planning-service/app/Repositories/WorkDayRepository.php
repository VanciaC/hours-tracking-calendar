<?php declare(strict_types=1);

namespace App\Repositories;

use App\DataTransferObjects\ShiftData;
use App\Models\WorkDay;
use App\Repositories\Contracts\WorkDayRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;
use Illuminate\Support\Facades\DB;

final class WorkDayRepository implements WorkDayRepositoryInterface
{
    /**
     * @return Enumerable<int, WorkDay>
     */
    public function findByUserBetween(int $userId, CarbonInterface $from, CarbonInterface $to): Enumerable
    {
        return WorkDay::query()
            ->where('user_id', $userId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->get();
    }

    public function saveDay(
        int $userId,
        CarbonInterface $date,
        string $mode,
        int $durationMinutes,
        array $shifts,
        ?string $note,
    ): WorkDay {
        // One transaction: never leave a day with half of its old shifts and half of the new ones.
        return DB::transaction(function () use ($userId, $date, $mode, $durationMinutes, $shifts, $note): WorkDay {
            $workDay = WorkDay::query()->updateOrCreate(
                ['user_id' => $userId, 'date' => $date->toDateString()],
                ['mode' => $mode, 'duration_minutes' => $durationMinutes, 'note' => $note],
            );

            $workDay->shifts()->delete();
            $workDay->shifts()->createMany(array_map(
                static fn (ShiftData $shift): array => [
                    'start_time' => $shift->startTime,
                    'end_time' => $shift->endTime,
                    'unpaid_break_minutes' => $shift->unpaidBreakMinutes,
                ],
                $shifts,
            ));

            return $workDay->load('shifts');
        });
    }

    public function saveDays(
        int $userId,
        array $dates,
        string $mode,
        int $durationMinutes,
        array $shifts,
        ?string $note,
    ): Enumerable {
        // All or nothing: if one day fails, every day of the batch is rolled back.
        return DB::transaction(fn (): Enumerable => collect($dates)
            ->unique(static fn (CarbonInterface $date): string => $date->toDateString())
            ->map(fn (CarbonInterface $date): WorkDay => $this->saveDay(
                $userId, $date, $mode, $durationMinutes, $shifts, $note,
            ))
            ->values());
    }

    public function findForUser(int $id, int $userId): ?WorkDay
    {
        return WorkDay::query()
            ->whereKey($id)
            ->where('user_id', $userId)
            ->first();
    }

    public function delete(WorkDay $workDay): void
    {
        DB::transaction(function () use ($workDay): void {
            $workDay->shifts()->delete();
            $workDay->delete();
        });
    }
}