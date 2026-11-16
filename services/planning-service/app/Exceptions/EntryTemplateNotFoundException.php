<?php

declare(strict_types=1);

namespace App\Exceptions;

use GraphQL\Error\ClientAware;
use RuntimeException;

/**
 * Thrown when a template does not exist or belongs to another user:
 * both cases give the same answer, so a template's existence is never revealed.
 */
final class EntryTemplateNotFoundException extends RuntimeException implements ClientAware
{
    public static function withId(int $id): self
    {
        return new self("Entry template {$id} not found.");
    }

    public function isClientSafe(): bool
    {
        return true;
    }
}
