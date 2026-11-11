<?php declare(strict_types=1);

namespace Database\Factories;

use App\Models\WorkDay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkDay>
 */
final class WorkDayFactory extends Factory
{
    protected $model = WorkDay::class;

    /**
     * A work day recorded as a plain duration, between 4h and 9h by 15-minute steps.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => fake()->numberBetween(1, 1000),
            // unique() avoids collisions with the (user_id, date) unique index
            'date' => fake()->unique()->dateTimeBetween('-3 months', '+1 month')->format('Y-m-d'),
            'mode' => WorkDay::MODE_DURATION,
            'duration_minutes' => fake()->numberBetween(16, 36) * 15,
            'note' => null,
        ];
    }

    public function forUser(int $userId): self
    {
        return $this->state(['user_id' => $userId]);
    }

    public function onDate(string $date): self
    {
        return $this->state(['date' => $date]);
    }

    public function withDuration(int $minutes): self
    {
        return $this->state(['duration_minutes' => $minutes]);
    }
}