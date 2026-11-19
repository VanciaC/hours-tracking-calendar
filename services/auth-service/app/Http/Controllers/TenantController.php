<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Tenancy\CurrentTenant;
use Illuminate\Http\JsonResponse;

/**
 * Tells the front end which company its address belongs to.
 */
final class TenantController
{
    public function __construct(
        private readonly CurrentTenant $currentTenant,
    ) {}

    /**
     * GET /auth/tenant
     *
     * Unknown or suspended companies never reach this point: ResolveTenant answers 404 or 403 first.
     */
    public function show(): JsonResponse
    {
        $tenant = $this->currentTenant->require();

        return new JsonResponse([
            'slug' => $tenant->slug,
            'name' => $tenant->name,
        ]);
    }
}
