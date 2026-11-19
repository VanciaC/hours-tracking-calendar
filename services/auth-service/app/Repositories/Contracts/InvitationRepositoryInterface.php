<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Enums\Role;
use App\Models\Invitation;
use Carbon\CarbonImmutable;
use Illuminate\Support\Enumerable;

/**
 * Data access for invitations.
 *
 * Technical contract only, no business rules here.
 */
interface InvitationRepositoryInterface
{
    public function findById(int $id): ?Invitation;

    public function findByHash(string $tokenHash): ?Invitation;

    /**
     * Every invitation, pending, accepted or expired, newest first, with the admin who sent it.
     *
     * @return Enumerable<int, Invitation>
     */
    public function findAllLatestFirst(): Enumerable;

    /**
     * @param  int|null  $invitedBy  null when invited from the server (first admin of a company)
     */
    public function create(
        string $email,
        string $tokenHash,
        ?int $invitedBy,
        CarbonImmutable $expiresAt,
        Role $role = Role::User,
    ): Invitation;

    /**
     * Replaces the token and the expiry date, so the previous link stops working.
     */
    public function renew(Invitation $invitation, string $tokenHash, CarbonImmutable $expiresAt): void;

    public function markAccepted(Invitation $invitation): void;

    public function deleteForEmail(string $email): void;

    public function delete(Invitation $invitation): void;
}
