<?php declare(strict_types=1);

namespace App\Services;

use App\Models\HourlyRate;
use App\Repositories\Contracts\HourlyRateRepositoryInterface;
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
}