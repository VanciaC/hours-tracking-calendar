<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\WorkDayFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Hours recorded for one day.
 *
 * @property int $id
 * @property int $user_id
 * @property Carbon $date
 * @property string $mode duration|slots
 * @property int $duration_minutes
 * @property string|null $note
 * @property int $tenant_id
 */
class WorkDay extends Model
{
    /** @use HasFactory<WorkDayFactory> */
    use BelongsToTenant, HasFactory;

    public const MODE_DURATION = 'duration';

    public const MODE_SLOTS = 'slots';

    protected $fillable = [
        'user_id',
        'date',
        'mode',
        'duration_minutes',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'duration_minutes' => 'integer',
        ];
    }

    /** @return HasMany<Shift, $this> */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class)->orderBy('start_time');
    }
}
