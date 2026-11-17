<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Expected error of the /auth endpoints, rendered as {"message", "code"} with an HTTP status.
 *
 * Not reported to the logs: these are normal outcomes (wrong password...), not bugs.
 */
abstract class ApiException extends RuntimeException
{
    abstract public function errorCode(): string;

    abstract public function status(): int;

    /**
     * @return array<string, string>
     */
    public function headers(): array
    {
        return [];
    }

    public function render(): JsonResponse
    {
        return new JsonResponse(
            ['message' => $this->getMessage(), 'code' => $this->errorCode()],
            $this->status(),
            $this->headers(),
        );
    }
}
