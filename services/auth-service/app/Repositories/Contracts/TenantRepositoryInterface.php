<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Enums\TenantStatus;
use App\Models\Tenant;

/**
 * Data access for companies.
 *
 * Technical contract only, no business rules here.
 */
interface TenantRepositoryInterface
{
    public function findBySlug(string $slug): ?Tenant;

    public function create(string $slug, string $name): Tenant;

    public function setStatus(Tenant $tenant, TenantStatus $status): void;
}
