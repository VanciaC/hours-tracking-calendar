<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;

final class TenantRepository implements TenantRepositoryInterface
{
    public function findBySlug(string $slug): ?Tenant
    {
        return Tenant::query()->where('slug', $slug)->first();
    }

    public function create(string $slug, string $name): Tenant
    {
        return Tenant::query()->create([
            'slug' => $slug,
            'name' => $name,
        ]);
    }

    public function setStatus(Tenant $tenant, TenantStatus $status): void
    {
        $tenant->forceFill(['status' => $status])->save();
    }
}
