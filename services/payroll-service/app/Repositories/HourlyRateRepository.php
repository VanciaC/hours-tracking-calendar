<?php declare(strict_types=1);

namespace App\Repositories;

use App\Models\HourlyRate;
use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use Carbon\CarbonInterface;
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

    public function saveForDate(int $userId, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate
    {
        return HourlyRate::query()->updateOrCreate(
            ['user_id' => $userId, 'effective_from' => $effectiveFrom->toDateString()],
            ['amount_cents' => $amountCents],
        );
    }
}