<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\Role;
use App\Models\Invitation;
use App\Repositories\Contracts\InvitationRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Enumerable;

final class InvitationRepository implements InvitationRepositoryInterface
{
    public function findById(int $id): ?Invitation
    {
        return Invitation::query()->find($id);
    }

    public function findByHash(string $tokenHash): ?Invitation
    {
        return Invitation::query()->where('token_hash', $tokenHash)->first();
    }

    /**
     * @return Enumerable<int, Invitation>
     */
    public function findAllLatestFirst(): Enumerable
    {
        return Invitation::query()
            ->with('inviter')
            ->latest()
            ->orderByDesc('id')
            ->get();
    }

    public function create(
        string $email,
        string $tokenHash,
        ?int $invitedBy,
        CarbonImmutable $expiresAt,
        Role $role = Role::User,
    ): Invitation {
        // forceCreate: the role is not fillable, so it can never come from an API argument.
        return Invitation::query()->forceCreate([
            'email' => $email,
            'role' => $role->value,
            'token_hash' => $tokenHash,
            'invited_by' => $invitedBy,
            'expires_at' => $expiresAt,
        ]);
    }

    public function renew(Invitation $invitation, string $tokenHash, CarbonImmutable $expiresAt): void
    {
        $invitation->forceFill([
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ])->save();
    }

    public function markAccepted(Invitation $invitation): void
    {
        $invitation->forceFill(['accepted_at' => CarbonImmutable::now()])->save();
    }

    public function deleteForEmail(string $email): void
    {
        Invitation::query()->where('email', $email)->delete();
    }

    public function delete(Invitation $invitation): void
    {
        $invitation->delete();
    }
}
