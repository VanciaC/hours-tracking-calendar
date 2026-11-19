<?php

declare(strict_types=1);

namespace App\Console\Commands\Concerns;

use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Tenancy\CurrentTenant;
use Illuminate\Console\Command;

/**
 * For commands with a --tenant option: they work inside that company only.
 *
 * @phpstan-require-extends Command
 */
trait SelectsTenant
{
    /**
     * Selects the company of --tenant for the rest of the command.
     * Null, with an error printed, when it does not exist.
     */
    protected function selectTenant(TenantRepositoryInterface $tenantRepository, CurrentTenant $currentTenant): ?Tenant
    {
        $slug = $this->option('tenant');
        $tenant = is_string($slug) ? $tenantRepository->findBySlug(mb_strtolower(trim($slug))) : null;

        if ($tenant === null) {
            $this->error('Unknown company. Give its subdomain with --tenant, e.g. --tenant=dupont.');

            return null;
        }

        $currentTenant->set($tenant);

        return $tenant;
    }
}
