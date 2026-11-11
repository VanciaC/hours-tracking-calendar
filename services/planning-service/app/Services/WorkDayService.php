<?php declare(strict_types=1);

namespace App\Services;

use App\Models\WorkDay;
use App\Repositories\Contracts\WorkDayRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;
use InvalidArgumentException;

/**
 * Business logic for work days.
 */
final class WorkDayService
{
    public function __construct(
        private readonly WorkDayRepositoryInterface $workDayRepository,
    ) {}

    /**
     * Work days recorded by a user over a period (inclusive bounds).
     *
     * @return Enumerable<int, WorkDay>
     *
     * @throws InvalidArgumentException when the end date is before the start date
     */
    public function getUserWorkDaysBetween(int $userId, CarbonInterface $from, CarbonInterface $to): Enumerable
    {
        if ($to->lessThan($from)) {
            throw new InvalidArgumentException('The end date must be on or after the start date.');
        }

        return $this->workDayRepository->findByUserBetween($userId, $from, $to);
    }
}