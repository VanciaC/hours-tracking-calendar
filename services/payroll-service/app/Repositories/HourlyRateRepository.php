<?php declare(strict_types=1);

namespace App\Repositories;

use App\Models\HourlyRate;
use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use Illuminate\Support\Enumerable;

final class HourlyRateRepository implements HourlyRateRepositoryInterface
{
    /**
     * @return Enumerable<int, HourlyRate>
     */
    public function findByUser(int $userId): Enumerable
    {
        return HourlyRate::query()
            ->where('user_id', $userId)
            ->orderByDesc('effective_from')
            ->get();
    }
}