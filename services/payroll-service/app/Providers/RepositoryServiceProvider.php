<?php declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use App\Repositories\HourlyRateRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Binds repository contracts to their implementations.
 */
final class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(HourlyRateRepositoryInterface::class, HourlyRateRepository::class);
    }
}