<?php declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\HourlyRate;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;

/**
 * Data access for hourly rates.
 *
 * Technical contract only, no business rules here.
 */
interface HourlyRateRepositoryInterface
{
    /**
     * Hourly rates of a user, most recent effective date first.
     *
     * @return Enumerable<int, HourlyRate>
     */
    public function findByUser(int $userId): Enumerable;

    /**
     * Create the user's rate for the given date, or replace it if one already exists on that date.
     */
    public function saveForDate(int $userId, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate;

    /**
     * Find a rate only if it belongs to the given user.
     */
    public function findForUser(int $id, int $userId): ?HourlyRate;

    /**
     * Whether the user already has a rate on that date, optionally ignoring one rate (the one being edited).
     */
    public function existsForUserOnDate(int $userId, CarbonInterface $date, ?int $exceptId = null): bool;

    public function update(HourlyRate $rate, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate;

    public function delete(HourlyRate $rate): void;
}