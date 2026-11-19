<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Shift;
use App\Models\WorkDay;
use App\Tenancy\CurrentTenant;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Fills varied demo hours for the given users, to try the team schedule. Development only.
 *
 * Replaces their days from one week before the current month to one week after it.
 */
final class DemoTeamScheduleCommand extends Command
{
    protected $signature = 'demo:team-schedule
        {userIds* : Ids of the users to fill}
        {--tenant= : Id of their company}';

    protected $description = 'Fill a few weeks of varied demo hours for the given users (development only)';

    /**
     * One pattern per user, in turn: shifts as [start, end, unpaid break minutes], or a duration in minutes.
     *
     * @var list<list<array{string, string, int}>|int>
     */
    private const PATTERNS = [
        [['06:00', '14:00', 30]],
        [['09:00', '12:30', 0], ['13:30', '17:00', 0]],
        [['14:00', '22:00', 30]],
        [['10:00', '16:00', 0]],
        [['11:00', '15:00', 0], ['18:00', '23:00', 0]],
        420,
        [['08:00', '16:00', 45]],
    ];

    /** Shifts move by one of these offsets, in minutes, so days do not all look the same. */
    private const OFFSETS = [0, 0, 30, -30];

    public function handle(): int
    {
        $tenantId = $this->option('tenant');

        if (! is_string($tenantId) || ! ctype_digit($tenantId)) {
            $this->error('Give the id of the users\' company with --tenant.');

            return self::FAILURE;
        }

        app(CurrentTenant::class)->set((int) $tenantId);

        /** @var list<string> $arguments */
        $arguments = (array) $this->argument('userIds');
        $userIds = array_values(array_unique(array_map('intval', $arguments)));

        $from = CarbonImmutable::today()->startOfMonth()->subWeek()->startOfWeek();
        $to = CarbonImmutable::today()->endOfMonth()->addWeek()->endOfWeek();

        $this->clear($userIds, $from, $to);

        $created = 0;

        foreach ($userIds as $index => $userId) {
            // Same user, same demo hours: reruns give the same schedule.
            mt_srand($userId);
            $pattern = self::PATTERNS[$index % count(self::PATTERNS)];

            for ($day = $from; $day->lte($to); $day = $day->addDay()) {
                $worksThatDay = mt_rand(1, 100) <= ($day->isWeekend() ? 20 : 85);

                if ($worksThatDay) {
                    $this->createDay($userId, $day, $pattern, self::OFFSETS[mt_rand(0, count(self::OFFSETS) - 1)]);
                    $created++;
                }
            }
        }

        $this->info("{$created} demo days created for ".count($userIds).' users, '
            ."from {$from->toDateString()} to {$to->toDateString()}.");

        return self::SUCCESS;
    }

    /**
     * @param  list<int>  $userIds
     */
    private function clear(array $userIds, CarbonImmutable $from, CarbonImmutable $to): void
    {
        $days = WorkDay::query()
            ->whereIn('user_id', $userIds)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()]);

        Shift::query()->whereIn('work_day_id', (clone $days)->select('id'))->delete();
        $days->delete();
    }

    /**
     * @param  list<array{string, string, int}>|int  $pattern
     */
    private function createDay(int $userId, CarbonImmutable $day, array|int $pattern, int $offset): void
    {
        if (is_int($pattern)) {
            WorkDay::query()->create([
                'user_id' => $userId,
                'date' => $day->toDateString(),
                'mode' => WorkDay::MODE_DURATION,
                'duration_minutes' => $pattern + $offset,
            ]);

            return;
        }

        $shifts = array_map(fn (array $shift): array => [
            'start_time' => $this->shiftTime($shift[0], $offset),
            'end_time' => $this->shiftTime($shift[1], $offset),
            'unpaid_break_minutes' => $shift[2],
        ], $pattern);

        $minutes = array_sum(array_map(
            fn (array $shift): int => $this->toMinutes($shift['end_time'])
                - $this->toMinutes($shift['start_time'])
                - $shift['unpaid_break_minutes'],
            $shifts,
        ));

        $workDay = WorkDay::query()->create([
            'user_id' => $userId,
            'date' => $day->toDateString(),
            'mode' => WorkDay::MODE_SLOTS,
            'duration_minutes' => $minutes,
        ]);

        $workDay->shifts()->createMany($shifts);
    }

    /** "06:00" moved by -30 -> "05:30:00" */
    private function shiftTime(string $time, int $offset): string
    {
        $minutes = $this->toMinutes($time) + $offset;

        return sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
    }

    private function toMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return $hours * 60 + $minutes;
    }
}
