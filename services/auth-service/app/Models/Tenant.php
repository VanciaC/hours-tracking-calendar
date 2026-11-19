<?php

namespace App\Models;

use App\Enums\TenantStatus;
use Carbon\CarbonImmutable;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A client company, reached on its own subdomain: {slug}.ton-domaine.fr.
 *
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property TenantStatus $status
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 */
#[Fillable(['slug', 'name'])]
class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    /** Lowercase letters, digits and inner dashes, 1 to 63 characters: a valid DNS label. */
    public const SLUG_PATTERN = '/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/';

    /** Subdomains kept for the platform itself. */
    public const RESERVED_SLUGS = ['www', 'api', 'app', 'admin', 'mail', 'auth', 'static', 'status'];

    /**
     * New companies are active. Set here too, so a model just created knows it without a reload.
     *
     * @var array<string, string>
     */
    protected $attributes = [
        'status' => 'active',
    ];

    public function isActive(): bool
    {
        return $this->status === TenantStatus::Active;
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
        ];
    }
}
