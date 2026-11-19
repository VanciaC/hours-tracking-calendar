<?php

declare(strict_types=1);

namespace App\Tenancy;

use LogicException;

/**
 * Id of the company of the current request (from the access token) or command (--tenant).
 *
 * This service has no companies table: the id comes from auth-service, in the token.
 */
final class CurrentTenant
{
    private ?int $id = null;

    public function set(int $id): void
    {
        $this->id = $id;
    }

    public function forget(): void
    {
        $this->id = null;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    /**
     * @throws LogicException when no company is selected: a programming error, never a user error
     */
    public function require(): int
    {
        return $this->id ?? throw new LogicException('No company is selected for this request.');
    }
}
