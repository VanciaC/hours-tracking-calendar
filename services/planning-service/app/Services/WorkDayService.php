<?php

declare(strict_types=1);

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
    public function __construct(
        private readonly WorkDayRepositoryInterface $workDayRepository,
        private readonly WorkTimeCalculator $calculator = new WorkTimeCalculator,
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
     * @param  list<ShiftData>  $shifts  Used in slots mode only.
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
        [$minutes, $shiftsToStore] = $this->resolveHours($mode, $durationMinutes, $shifts);

        return $this->workDayRepository->saveDay($userId, $date, $mode, $minutes, $shiftsToStore, $note);
    }

    /**
     * Record the same hours on several days, all or nothing.
     *
     * @param  list<CarbonInterface>  $dates
     * @param  list<ShiftData>  $shifts  Used in slots mode only.
     * @return Enumerable<int, WorkDay>
     *
     * @throws InvalidWorkDayException when the duration or the shifts break a rule
     */
    public function saveDays(
        int $userId,
        array $dates,
        string $mode,
        ?int $durationMinutes,
        array $shifts,
        ?string $note,
    ): Enumerable {
        // Checked once, before anything is written: every day gets the same hours.
        [$minutes, $shiftsToStore] = $this->resolveHours($mode, $durationMinutes, $shifts);

        return $this->workDayRepository->saveDays($userId, $dates, $mode, $minutes, $shiftsToStore, $note);
    }

    /**
     * Net minutes to store, and the shifts to keep (none for a day typed as a duration).
     *
     * @param  list<ShiftData>  $shifts
     * @return array{int, list<ShiftData>}
     */
    private function resolveHours(string $mode, ?int $durationMinutes, array $shifts): array
    {
        return $mode === WorkDay::MODE_SLOTS
            ? [$this->calculator->netMinutes($shifts), $shifts]
            : [$this->calculator->checkDuration($durationMinutes), []];
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
}
