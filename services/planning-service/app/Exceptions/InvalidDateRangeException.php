<?php declare(strict_types=1);

namespace App\Exceptions;

use Carbon\CarbonInterface;
use GraphQL\Error\ClientAware;
use InvalidArgumentException;

/**
 * Thrown when a period ends before it starts.
 *
 * Client safe: graphql-php keeps the message instead of
 * replacing it with "Internal server error".
 */
final class InvalidDateRangeException extends InvalidArgumentException implements ClientAware
{
    public static function endBeforeStart(CarbonInterface $from, CarbonInterface $to): self
    {
        return new self(sprintf(
            'The end date (%s) must be on or after the start date (%s).',
            $to->toDateString(),
            $from->toDateString(),
        ));
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}