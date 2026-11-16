<?php declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\DataTransferObjects\ShiftData;
use App\Models\WorkDay;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;

/**
 * Data access for recorded work days.
 *
 * Technical contract only, no business rules here.
 */
interface WorkDayRepositoryInterface
{
    /**
     * Work days of a user between two dates (inclusive), ordered by date.
     *
     * @return Enumerable<int, WorkDay>
     */
    public function findByUserBetween(int $userId, CarbonInterface $from, CarbonInterface $to): Enumerable;

    /**
     * Create the user's day on that date, or replace it (and all its shifts) if one exists.
     *
     * @param list<ShiftData> $shifts
     */
    public function saveDay(
        int $userId,
        CarbonInterface $date,
        string $mode,
        int $durationMinutes,
        array $shifts,
        ?string $note,
    ): WorkDay;

    /**
     * Save the same hours on several days in one transaction: all or nothing.
     *
     * @param list<CarbonInterface> $dates
     * @param list<ShiftData> $shifts
     *
     * @return Enumerable<int, WorkDay>
     */
    public function saveDays(
        int $userId,
        array $dates,
        string $mode,
        int $durationMinutes,
        array $shifts,
        ?string $note,
    ): Enumerable;

    /**
     * Find a day only if it belongs to the given user.
     */
    public function findForUser(int $id, int $userId): ?WorkDay;

    /**
     * Delete a day and its shifts.
     */
    public function delete(WorkDay $workDay): void;
}