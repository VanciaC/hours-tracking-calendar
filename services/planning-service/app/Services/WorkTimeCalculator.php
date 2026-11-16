<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\ShiftData;
use App\Exceptions\InvalidWorkDayException;

/**
 * Worked time rules shared by work days and entry templates.
 */
final class WorkTimeCalculator
{
    public const MINUTES_PER_DAY = 24 * 60;

    /**
     * @throws InvalidWorkDayException when the duration is not between 1 minute and 24 hours
     */
    public function checkDuration(?int $minutes): int
    {
        if ($minutes === null || $minutes < 1 || $minutes > self::MINUTES_PER_DAY) {
            throw InvalidWorkDayException::invalidDuration();
        }

        return $minutes;
    }

    /**
     * Net worked minutes: sum of (end - start - unpaid break) over the shifts.
     *
     * @param  list<ShiftData>  $shifts
     *
     * @throws InvalidWorkDayException when a shift breaks a rule
     */
    public function netMinutes(array $shifts): int
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
