<?php declare(strict_types=1);

namespace Database\Factories;

use App\Models\HourlyRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HourlyRate>
 */
final class HourlyRateFactory extends Factory
{
    protected $model = HourlyRate::class;

    /**
     * A gross hourly rate between 12€ and 25€.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => fake()->numberBetween(1, 1000),
            'amount_cents' => fake()->numberBetween(1200, 2500),
            // unique() avoids collisions with the (user_id, effective_from) unique index
            'effective_from' => fake()->unique()->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
        ];
    }

    public function forUser(int $userId): self
    {
        return $this->state(['user_id' => $userId]);
    }

    public function effectiveFrom(string $date): self
    {
        return $this->state(['effective_from' => $date]);
    }

    public function amount(int $cents): self
    {
        return $this->state(['amount_cents' => $cents]);
    }
}