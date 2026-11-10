<?php declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Créneau d'une journée en mode « Créneaux ».
 *
 * @property int $id
 * @property int $work_day_id
 * @property string $start_time
 * @property string $end_time
 * @property int $break_minutes
 */
class Shift extends Model
{
    protected $fillable = [
        'work_day_id',
        'start_time',
        'end_time',
        'break_minutes',
    ];

    protected function casts(): array
    {
        return [
            'break_minutes' => 'integer',
        ];
    }

    /** @return BelongsTo<WorkDay, $this> */
    public function workDay(): BelongsTo
    {
        return $this->belongsTo(WorkDay::class);
    }
}
