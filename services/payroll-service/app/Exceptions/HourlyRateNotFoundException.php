<?php declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use RuntimeException;

/**
 * Thrown when a rate does not exist or belongs to another user:
 * both cases give the same answer, so a rate's existence is never revealed.
 */
final class HourlyRateNotFoundException extends RuntimeException implements ClientAware
{
    public static function withId(int $id): self
    {
        return new self("Hourly rate {$id} not found.");
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}