<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EntryTemplate;
use App\Models\WorkDay;
use Illuminate\Database\Seeder;

/**
 * Demo entry templates for the seeded user. Idempotent: safe to run twice.
 */
final class EntryTemplateSeeder extends Seeder
{
    private const DEMO_USER_ID = 1;

    public function run(): void
    {
        EntryTemplate::query()->updateOrCreate(
            ['user_id' => self::DEMO_USER_ID, 'label' => 'Journée standard'],
            [
                'mode' => WorkDay::MODE_SLOTS,
                'duration_minutes' => null,
                'slots' => [
                    ['start_time' => '08:00', 'end_time' => '15:00', 'unpaid_break_minutes' => 0],
                ],
                'is_default' => true,
                'usage_count' => 12,
            ],
        );

        EntryTemplate::query()->updateOrCreate(
            ['user_id' => self::DEMO_USER_ID, 'label' => 'Mi-temps'],
            [
                'mode' => WorkDay::MODE_DURATION,
                'duration_minutes' => 210,
                'slots' => null,
                'is_default' => false,
                'usage_count' => 3,
            ],
        );
    }
}
