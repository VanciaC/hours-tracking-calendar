<?php

declare(strict_types=1);

namespace App\Exceptions;

use Carbon\CarbonInterface;
use GraphQL\Error\ClientAware;
use RuntimeException;

final class HourlyRateDateTakenException extends RuntimeException implements ClientAware
{
    public static function on(CarbonInterface $date): self
    {
        return new self("An hourly rate already exists on {$date->toDateString()}.");
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}
