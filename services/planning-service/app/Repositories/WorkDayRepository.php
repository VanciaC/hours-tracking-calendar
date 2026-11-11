<?php declare(strict_types=1);

namespace App\Repositories;

use App\Models\WorkDay;
use App\Repositories\Contracts\WorkDayRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;

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
}