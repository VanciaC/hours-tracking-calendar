<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Auth\AuthenticatedUser;
use App\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs the request in the company of its access token, before any query reaches the database.
 *
 * Without a valid token nothing is set, and nothing is reachable either: every root field
 * is behind @guard, and the User entity refuses anonymous callers.
 */
final class SetTenantFromToken
{
    public function __construct(
        private readonly AuthFactory $auth,
        private readonly CurrentTenant $currentTenant,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $this->auth->guard()->user();

        if (! $user instanceof AuthenticatedUser || $user->tenantId === null) {
            return $next($request);
        }

        // Restored afterwards, so one request never leaves its company behind for the next one.
        $previous = $this->currentTenant->id();
        $this->currentTenant->set($user->tenantId);

        try {
            return $next($request);
        } finally {
            $previous === null ? $this->currentTenant->forget() : $this->currentTenant->set($previous);
        }
    }
}
