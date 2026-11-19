<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Tenancy\CurrentTenant;
use Illuminate\Database\Eloquent\Model;

/**
 * For models that belong to a company: queries only see the current company,
 * and new rows are created in it.
 *
 * @phpstan-require-extends Model
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model): void {
            if ($model->getAttribute('tenant_id') === null) {
                $model->setAttribute('tenant_id', app(CurrentTenant::class)->require());
            }
        });
    }
}
