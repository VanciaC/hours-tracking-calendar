<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\EntryTemplate;
use App\Models\WorkDay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EntryTemplate>
 */
final class EntryTemplateFactory extends Factory
{
    protected $model = EntryTemplate::class;

    public function definition(): array
    {
        return [
            'user_id' => fake()->numberBetween(1, 1000),
            'label' => fake()->words(2, true),
            'mode' => WorkDay::MODE_DURATION,
            'duration_minutes' => 420,
            'slots' => null,
            'is_default' => false,
            'usage_count' => 0,
        ];
    }

    public function forUser(int $userId): static
    {
        return $this->state(['user_id' => $userId]);
    }

    public function withDuration(int $minutes): static
    {
        return $this->state([
            'mode' => WorkDay::MODE_DURATION,
            'duration_minutes' => $minutes,
            'slots' => null,
        ]);
    }

    /**
     * @param  array<int, array{start_time: string, end_time: string, unpaid_break_minutes: int}>  $slots
     */
    public function withSlots(array $slots): static
    {
        return $this->state([
            'mode' => WorkDay::MODE_SLOTS,
            'duration_minutes' => null,
            'slots' => $slots,
        ]);
    }

    public function asDefault(): static
    {
        return $this->state(['is_default' => true]);
    }

    public function usedTimes(int $count): static
    {
        return $this->state(['usage_count' => $count]);
    }
}
