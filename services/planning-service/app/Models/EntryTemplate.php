<?php declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle de saisie réutilisable (ex. « 8:00 → 15:00 »).
 *
 * @property int $id
 * @property int $user_id
 * @property string|null $label
 * @property string $mode duration|slots
 * @property int|null $duration_minutes
 * @property array<int, array{start_time: string, end_time: string, break_minutes: int}>|null $slots
 * @property bool $is_default
 * @property int $usage_count
 */
class EntryTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'label',
        'mode',
        'duration_minutes',
        'slots',
        'is_default',
        'usage_count',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'slots' => 'array',
            'is_default' => 'boolean',
            'usage_count' => 'integer',
        ];
    }
}
