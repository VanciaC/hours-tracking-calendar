<?php declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Reusable entry preset (e.g. "8:00 -> 15:00").
 *
 * Applying a template copies its content into a WorkDay: the day keeps
 * no reference to the template, so editing a template never alters past days.
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
    use HasFactory;

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