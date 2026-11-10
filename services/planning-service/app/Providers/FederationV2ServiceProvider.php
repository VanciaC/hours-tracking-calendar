<?php declare(strict_types=1);

namespace App\Providers;

use App\GraphQL\Federation\FederationV2Service;
use Illuminate\Support\ServiceProvider;
use Nuwave\Lighthouse\Federation\Resolvers\Service;

/**
 * Branche l'override Federation 2 sur Lighthouse.
 *
 * À déclarer dans bootstrap/providers.php (Laravel 11+), en plus de
 * Nuwave\Lighthouse\Federation\FederationServiceProvider.
 * L'ordre n'a pas d'importance, le bind est résolu à l'exécution.
 */
class FederationV2ServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Service::class, FederationV2Service::class);
    }
}
