<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\HourlyRateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Gross hourly rate, valid from an effective date.
 *
 * @property int $id
 * @property int $user_id
 * @property int $amount_cents
 * @property Carbon $effective_from
 * @property int $tenant_id
 */
class HourlyRate extends Model
{
    /** @use HasFactory<HourlyRateFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'user_id',
        'amount_cents',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'effective_from' => 'date',
        ];
    }
}
