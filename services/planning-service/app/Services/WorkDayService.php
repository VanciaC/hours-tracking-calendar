<?php declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\ShiftData;
use App\Exceptions\InvalidDateRangeException;
use App\Exceptions\InvalidWorkDayException;
use App\Exceptions\WorkDayNotFoundException;
use App\Models\WorkDay;
use App\Repositories\Contracts\WorkDayRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;

/**
 * Business logic for work days.
 *
 * Authorization is handled upstream: @guard on root types,
 * ownership in App\GraphQL\Entities\User.
 */
final class WorkDayService
{
    private const MINUTES_PER_DAY = 24 * 60;

    public function __construct(
        private readonly WorkDayRepositoryInterface $workDayRepository,
    ) {}

    /**
     * Work days recorded by a user over a period (inclusive bounds).
     *
     * @return Enumerable<int, WorkDay>
     *
     * @throws InvalidDateRangeException when the end date is before the start date
     */
    public function getUserWorkDaysBetween(int $userId, CarbonInterface $from, CarbonInterface $to): Enumerable
    {
        if ($to->lessThan($from)) {
            throw InvalidDateRangeException::endBeforeStart($from, $to);
        }

        return $this->workDayRepository->findByUserBetween($userId, $from, $to);
    }

    /**
     * Record the hours of one day for the user, replacing what was recorded on that date.
     * In slots mode the net duration is computed here, once, and stored.
     *
     * @param list<ShiftData> $shifts Used in slots mode only.
     *
     * @throws InvalidWorkDayException when the duration or the shifts break a rule
     */
    public function saveDay(
        int $userId,
        CarbonInterface $date,
        string $mode,
        ?int $durationMinutes,
        array $shifts,
        ?string $note,
    ): WorkDay {
        if ($mode === WorkDay::MODE_SLOTS) {
            return $this->workDayRepository->saveDay(
                $userId, $date, $mode, $this->netMinutesOf($shifts), $shifts, $note,
            );
        }

        if ($durationMinutes === null || $durationMinutes < 1 || $durationMinutes > self::MINUTES_PER_DAY) {
            throw InvalidWorkDayException::invalidDuration();
        }

        // A day typed as a duration has no shift.
        return $this->workDayRepository->saveDay($userId, $date, $mode, $durationMinutes, [], $note);
    }

    /**
     * Delete one of the user's days and return it.
     *
     * @throws WorkDayNotFoundException when the day is not the user's
     */
    public function deleteDay(int $userId, int $workDayId): WorkDay
    {
        $workDay = $this->workDayRepository->findForUser($workDayId, $userId)
            ?? throw WorkDayNotFoundException::withId($workDayId);

        $this->workDayRepository->delete($workDay);

        return $workDay;
    }

    /**
     * Net worked minutes: sum of (end - start - unpaid break) over the shifts.
     *
     * @param list<ShiftData> $shifts
     */
    private function netMinutesOf(array $shifts): int
    {
        if ($shifts === []) {
            throw InvalidWorkDayException::noShift();
        }

        // Sorted by start time, two shifts overlap when one starts before the previous one ends.
        usort($shifts, static fn (ShiftData $a, ShiftData $b): int => $a->startMinutes() <=> $b->startMinutes());

        $total = 0;
        $previousEnd = null;

        foreach ($shifts as $shift) {
            $length = $shift->endMinutes() - $shift->startMinutes();

            if ($length <= 0) {
                throw InvalidWorkDayException::shiftEndsBeforeStart($shift);
            }

            if ($previousEnd !== null && $shift->startMinutes() < $previousEnd) {
                throw InvalidWorkDayException::overlappingShifts();
            }

            if ($shift->unpaidBreakMinutes >= $length) {
                throw InvalidWorkDayException::breakTooLong($shift);
            }

            $total += $length - $shift->unpaidBreakMinutes;
            $previousEnd = $shift->endMinutes();
        }

        return $total;
    }
}