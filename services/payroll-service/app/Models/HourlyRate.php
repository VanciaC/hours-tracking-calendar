<?php declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Taux horaire brut, valable à partir d'une date d'effet.
 *
 * @property int $id
 * @property int $user_id
 * @property int $amount_cents
 * @property \Illuminate\Support\Carbon $effective_from
 */
class HourlyRate extends Model
{
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
