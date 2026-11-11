<?php declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\HourlyRate;
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
}