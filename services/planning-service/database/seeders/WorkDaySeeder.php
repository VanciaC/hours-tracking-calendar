<?php declare(strict_types=1);

namespace Database\Seeders;

use App\Models\WorkDay;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Fills the development database with work days for the demo user:
 * every weekday from the start of last month until today.
 */
final class WorkDaySeeder extends Seeder
{
    /** Matches the first user created by auth-service's seeder. */
    private const DEMO_USER_ID = 1;

    public function run(): void
    {
        // Idempotent: the seeder can be run again without hitting
        // the (user_id, date) unique index. Shifts are deleted in cascade.
        WorkDay::query()->where('user_id', self::DEMO_USER_ID)->delete();

        $period = CarbonPeriod::create(
            Carbon::now()->subMonthNoOverflow()->startOfMonth(),
            Carbon::today(),
        );

        foreach ($period as $date) {
            if ($date->isWeekend()) {
                continue;
            }

            WorkDay::factory()
                ->forUser(self::DEMO_USER_ID)
                ->onDate($date->toDateString())
                ->create();
        }
    }
}