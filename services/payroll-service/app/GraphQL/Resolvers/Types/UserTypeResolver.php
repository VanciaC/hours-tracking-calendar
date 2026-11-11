<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers\Types;

use App\Models\HourlyRate;
use App\Services\HourlyRateService;
use Illuminate\Support\Enumerable;

/**
 * Resolves the fields payroll-service contributes to the federated User type.
 */
final class UserTypeResolver
{
    public function __construct(
        private readonly HourlyRateService $hourlyRateService,
    ) {}

    /**
     * User.hourlyRates
     *
     * @param  array{id: string}  $root  User reference built by App\GraphQL\Entities\User
     *
     * @return Enumerable<int, HourlyRate>
     */
    public function hourlyRates(array $root): Enumerable
    {
        return $this->hourlyRateService->getUserRateHistory((int) $root['id']);
    }
}