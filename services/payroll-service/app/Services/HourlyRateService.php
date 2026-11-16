<?php declare(strict_types=1);

namespace App\Services;

use App\Models\HourlyRate;
use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;

/**
 * Business logic for hourly rates.
 */
final class HourlyRateService
{
    public function __construct(
        private readonly HourlyRateRepositoryInterface $hourlyRateRepository,
    ) {}

    /**
     * Rate history of a user, most recent first.
     *
     * @return Enumerable<int, HourlyRate>
     */
    public function getUserRateHistory(int $userId): Enumerable
    {
        return $this->hourlyRateRepository->findByUser($userId);
    }

    /**
     * Set the user's hourly rate from the given date (RG-07).
     * Rates of other dates are kept, so past periods stay priced at the rate they had.
     */
    public function setRate(int $userId, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate
    {
        return $this->hourlyRateRepository->saveForDate($userId, $effectiveFrom, $amountCents);
    }
}