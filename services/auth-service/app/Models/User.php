<?php

namespace App\Models;

use App\Enums\Role;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * "role" is not fillable on purpose: it only changes through artisan commands (RG-13).
 * "tenant_id" is not fillable either: it is set from the current company when the account is created.
 *
 * @property int $tenant_id
 */
#[Fillable(['name', 'email', 'password', 'locale'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements HasLocalePreference
{
    /** @use HasFactory<UserFactory> */
    use BelongsToTenant, HasFactory, Notifiable, Prunable;

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin->value;
    }

    /**
     * Notifications (emails) are sent in this language.
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }

    /**
     * Accounts never verified after the retention delay: deleted daily by model:prune.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $days = (int) config('registration.unverified_retention_days');

        return static::query()
            ->whereNull('email_verified_at')
            ->where('created_at', '<=', now()->subDays($days));
    }

    /**
     * Before the account goes, its pending verification links go too.
     * An unverified account cannot sign in, so it has no session or reset link.
     */
    protected function pruning(): void
    {
        EmailVerificationToken::query()->where('user_id', $this->id)->delete();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
