<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\TenantStatus;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Console\Command;

/**
 * Cuts a company off without deleting anything, or reactivates it with --resume.
 * Takes effect at once: every request checks the company's status.
 */
final class SuspendTenantCommand extends Command
{
    protected $signature = 'tenant:suspend
        {slug : Subdomain of the company}
        {--resume : Reactivate the company instead}';

    protected $description = 'Suspend a company, or reactivate it with --resume';

    public function handle(TenantRepositoryInterface $tenantRepository): int
    {
        $slug = mb_strtolower(trim((string) $this->argument('slug')));
        $tenant = $tenantRepository->findBySlug($slug);

        if ($tenant === null) {
            $this->error("No company with the subdomain {$slug}.");

            return self::FAILURE;
        }

        $status = $this->option('resume') ? TenantStatus::Active : TenantStatus::Suspended;
        $tenantRepository->setStatus($tenant, $status);

        $this->info("{$tenant->name} is now {$status->value}.");

        return self::SUCCESS;
    }
}
