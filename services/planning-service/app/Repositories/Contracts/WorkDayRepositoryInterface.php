<?php declare(strict_types=1);

namespace App\Repositories\Contracts;

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
}