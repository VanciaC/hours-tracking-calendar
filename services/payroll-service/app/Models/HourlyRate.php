<?php declare(strict_types=1);

namespace App\Models;

use Database\Factories\HourlyRateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Gross hourly rate, valid from an effective date.
 *
 * @property int $id
 * @property int $user_id
 * @property int $amount_cents
 * @property \Illuminate\Support\Carbon $effective_from
 */
class HourlyRate extends Model
{
    /** @use HasFactory<HourlyRateFactory> */
    use HasFactory;

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