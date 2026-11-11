<?php declare(strict_types=1);

namespace Database\Seeders;

use App\Models\HourlyRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Fills the development database with a rate history for the demo user:
 * a first rate at the start of the year and a raise at the start of the current month.
 */
final class HourlyRateSeeder extends Seeder
{
    /** Matches the first user created by auth-service's seeder. */
    private const DEMO_USER_ID = 1;

    public function run(): void
    {
        // Idempotent: the seeder can be run again without hitting
        // the (user_id, effective_from) unique index.
        HourlyRate::query()->where('user_id', self::DEMO_USER_ID)->delete();

        HourlyRate::factory()
            ->forUser(self::DEMO_USER_ID)
            ->effectiveFrom(Carbon::now()->startOfYear()->toDateString())
            ->amount(1250)
            ->create();

        HourlyRate::factory()
            ->forUser(self::DEMO_USER_ID)
            ->effectiveFrom(Carbon::now()->startOfMonth()->toDateString())
            ->amount(1300)
            ->create();
    }
}