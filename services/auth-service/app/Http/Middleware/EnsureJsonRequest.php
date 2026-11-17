<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accepts JSON requests only on /auth.
 *
 * A form on another site cannot send JSON without a CORS check. Together with the
 * SameSite=Strict cookie, this closes the door to cross-site request forgery (CSRF).
 */
final class EnsureJsonRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isJson()) {
            return new JsonResponse(['message' => 'Expected a JSON request.', 'code' => 'JSON_REQUIRED'], 415);
        }

        return $next($request);
    }
}
