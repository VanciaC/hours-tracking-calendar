<?php declare(strict_types=1);

namespace App\Exceptions;

use App\DataTransferObjects\ShiftData;
use GraphQL\Error\ClientAware;
use InvalidArgumentException;

final class InvalidWorkDayException extends InvalidArgumentException implements ClientAware
{
    public static function invalidDuration(): self
    {
        return new self('The duration must be between 1 minute and 24 hours.');
    }

    public static function noShift(): self
    {
        return new self('Add at least one shift.');
    }

    public static function shiftEndsBeforeStart(ShiftData $shift): self
    {
        return new self("Shift {$shift->label()} must end after it starts.");
    }

    public static function overlappingShifts(): self
    {
        return new self('Shifts must not overlap.');
    }

    public static function breakTooLong(ShiftData $shift): self
    {
        return new self("The unpaid break of shift {$shift->label()} must be shorter than the shift.");
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}