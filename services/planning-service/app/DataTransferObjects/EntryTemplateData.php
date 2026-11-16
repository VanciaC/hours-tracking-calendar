<?php declare(strict_types=1);

namespace App\DataTransferObjects;

/**
 * An entry template as typed by the user.
 */
final readonly class EntryTemplateData
{
    /**
     * @param list<ShiftData> $slots Used in slots mode only.
     */
    public function __construct(
        public string $label,
        public string $mode,
        public ?int $durationMinutes,
        public array $slots,
        public bool $isDefault,
    ) {}

    /**
     * @param array{
     *     label: string,
     *     mode: string,
     *     durationMinutes?: int|null,
     *     slots?: list<array{startTime: string, endTime: string, unpaidBreakMinutes?: int}>,
     *     isDefault?: bool,
     * } $input
     */
    public static function fromInput(array $input): self
    {
        return new self(
            $input['label'],
            $input['mode'],
            $input['durationMinutes'] ?? null,
            array_map(ShiftData::fromArray(...), $input['slots'] ?? []),
            $input['isDefault'] ?? false,
        );
    }
}