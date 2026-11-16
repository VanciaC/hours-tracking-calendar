<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A shift within a day recorded in slots mode.
 *
 * @property int $id
 * @property int $work_day_id
 * @property string $start_time
 * @property string $end_time
 * @property int $unpaid_break_minutes Deducted from worked time; 0 when breaks are paid.
 */
class Shift extends Model
{
    protected $fillable = [
        'work_day_id',
        'start_time',
        'end_time',
        'unpaid_break_minutes',
    ];

    protected function casts(): array
    {
        return [
            'unpaid_break_minutes' => 'integer',
        ];
    }

    /** @return BelongsTo<WorkDay, $this> */
    public function workDay(): BelongsTo
    {
        return $this->belongsTo(WorkDay::class);
    }
}
