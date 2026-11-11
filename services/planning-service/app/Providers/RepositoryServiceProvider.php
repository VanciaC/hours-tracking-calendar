<?php declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\WorkDayRepositoryInterface;
use App\Repositories\WorkDayRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Binds repository contracts to their implementations.
 */
final class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(WorkDayRepositoryInterface::class, WorkDayRepository::class);
    }
}