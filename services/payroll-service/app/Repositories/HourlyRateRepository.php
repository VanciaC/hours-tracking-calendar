<?php

declare(strict_types=1);

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

    public function findForUser(int $id, int $userId): ?HourlyRate
    {
        return HourlyRate::query()
            ->whereKey($id)
            ->where('user_id', $userId)
            ->first();
    }

    public function existsForUserOnDate(int $userId, CarbonInterface $date, ?int $exceptId = null): bool
    {
        return HourlyRate::query()
            ->where('user_id', $userId)
            ->whereDate('effective_from', $date->toDateString())
            ->when($exceptId !== null, fn ($query) => $query->whereKeyNot($exceptId))
            ->exists();
    }

    public function update(HourlyRate $rate, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate
    {
        $rate->update([
            'effective_from' => $effectiveFrom->toDateString(),
            'amount_cents' => $amountCents,
        ]);

        return $rate;
    }

    public function delete(HourlyRate $rate): void
    {
        $rate->delete();
    }
}
