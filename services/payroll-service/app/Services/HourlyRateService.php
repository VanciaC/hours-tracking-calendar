<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\HourlyRateDateTakenException;
use App\Exceptions\HourlyRateNotFoundException;
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

    /**
     * Change the amount and/or the effective date of one of the user's rates.
     *
     * @throws HourlyRateNotFoundException when the rate is not the user's
     * @throws HourlyRateDateTakenException when another rate already starts on that date
     */
    public function updateRate(int $userId, int $rateId, CarbonInterface $effectiveFrom, int $amountCents): HourlyRate
    {
        $rate = $this->findOwnedRate($userId, $rateId);

        if ($this->hourlyRateRepository->existsForUserOnDate($userId, $effectiveFrom, $rate->id)) {
            throw HourlyRateDateTakenException::on($effectiveFrom);
        }

        return $this->hourlyRateRepository->update($rate, $effectiveFrom, $amountCents);
    }

    /**
     * Delete one of the user's rates and return it.
     *
     * @throws HourlyRateNotFoundException when the rate is not the user's
     */
    public function deleteRate(int $userId, int $rateId): HourlyRate
    {
        $rate = $this->findOwnedRate($userId, $rateId);

        $this->hourlyRateRepository->delete($rate);

        return $rate;
    }

    private function findOwnedRate(int $userId, int $rateId): HourlyRate
    {
        return $this->hourlyRateRepository->findForUser($rateId, $userId)
            ?? throw HourlyRateNotFoundException::withId($rateId);
    }
}
