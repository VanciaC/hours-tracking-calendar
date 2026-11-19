<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use App\Enums\Role;
use App\Models\Concerns\BelongsToTenant;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Invitation sent by an admin to create an account (US-33).
 *
 * @property int $id
 * @property string $email
 * @property string $token_hash
 * @property int|null $invited_by
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $accepted_at
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property int $tenant_id
 * @property string $role
 */
#[Fillable(['email', 'token_hash', 'invited_by', 'expires_at'])]
#[Hidden(['token_hash'])]
class Invitation extends Model
{
    use BelongsToTenant, MassPrunable;

    public function status(): InvitationStatus
    {
        if ($this->accepted_at !== null) {
            return InvitationStatus::Accepted;
        }

        return $this->expires_at->isPast() ? InvitationStatus::Expired : InvitationStatus::Pending;
    }

    public function isPending(): bool
    {
        return $this->status() === InvitationStatus::Pending;
    }

    /**
     * Only the first admin of a company is invited as admin, by tenant:create (RG-13).
     */
    public function grantsAdmin(): bool
    {
        return $this->role === Role::Admin->value;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Accepted invitations, and expired ones once admins had time to resend them:
     * deleted daily by model:prune (privacy page, retention).
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $days = (int) config('registration.expired_invitation_retention_days', 30);

        return static::query()
            ->whereNotNull('accepted_at')
            ->orWhere('expires_at', '<', now()->subDays($days));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'immutable_datetime',
            'accepted_at' => 'immutable_datetime',
        ];
    }
}
