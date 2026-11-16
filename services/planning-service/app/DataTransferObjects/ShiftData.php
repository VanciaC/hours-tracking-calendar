<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

/**
 * A shift as typed by the user. Times are HH:MM within the same day.
 */
final readonly class ShiftData
{
    public function __construct(
        public string $startTime,
        public string $endTime,
        public int $unpaidBreakMinutes = 0,
    ) {}

    /**
     * @param  array{startTime: string, endTime: string, unpaidBreakMinutes?: int}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self($data['startTime'], $data['endTime'], $data['unpaidBreakMinutes'] ?? 0);
    }

    public function startMinutes(): int
    {
        return self::toMinutes($this->startTime);
    }

    public function endMinutes(): int
    {
        return self::toMinutes($this->endTime);
    }

    /** "08:00-15:00", used in error messages. */
    public function label(): string
    {
        return "{$this->startTime}-{$this->endTime}";
    }

    /** "08:30" -> 510 */
    private static function toMinutes(string $time): int
    {
        [$hours, $minutes] = explode(':', $time);

        return (int) $hours * 60 + (int) $minutes;
    }

    /**
     * Storage shape, shared by the shifts table and the slots of a template.
     *
     * @return array{start_time: string, end_time: string, unpaid_break_minutes: int}
     */
    public function toArray(): array
    {
        return [
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'unpaid_break_minutes' => $this->unpaidBreakMinutes,
        ];
    }
}
