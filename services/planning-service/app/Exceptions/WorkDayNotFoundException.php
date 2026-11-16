<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use RuntimeException;

/**
 * Thrown when a day does not exist or belongs to another user:
 * both cases give the same answer, so a day's existence is never revealed.
 */
final class WorkDayNotFoundException extends RuntimeException implements ClientAware
{
    public static function withId(int $id): self
    {
        return new self("Work day {$id} not found.");
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}
