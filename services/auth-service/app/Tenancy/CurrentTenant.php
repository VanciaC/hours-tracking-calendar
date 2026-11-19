<?php

declare(strict_types=1);

namespace App\Tenancy;

use App\Models\Tenant;
use LogicException;

/**
 * The company of the current request or command.
 *
 * Set by the subdomain middleware for HTTP requests and by the --tenant option of commands.
 * Empty only in server commands that work across companies, such as model:prune.
 */
final class CurrentTenant
{
    private ?Tenant $tenant = null;

    public function set(Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }

    public function forget(): void
    {
        $this->tenant = null;
    }

    public function get(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    /**
     * @throws LogicException when no company is selected: a programming error, never a user error
     */
    public function require(): Tenant
    {
        return $this->tenant ?? throw new LogicException('No company is selected for this request.');
    }
}
