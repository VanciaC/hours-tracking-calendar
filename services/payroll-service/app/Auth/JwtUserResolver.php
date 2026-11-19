<?php

declare(strict_types=1);

namespace App\Auth;

use App\Tenancy\RequestTenant;
use Illuminate\Http\Request;

/**
 * Resolves the authenticated user from the "Authorization: Bearer" header.
 *
 * Used as the callback of the "jwt" guard.
 */
final class JwtUserResolver
{
    public function __construct(
        private readonly JwtVerifier $jwtVerifier,
        private readonly RequestTenant $requestTenant,
    ) {}

    public function __invoke(Request $request): ?AuthenticatedUser
    {
        $token = $request->bearerToken();

        if ($token === null) {
            return null;
        }

        $verified = $this->jwtVerifier->verify($token);

        // A token only works on its own company's address: copied to another company, it is worthless.
        if ($verified === null || $verified->tenantSlug !== $this->requestTenant->slug($request)) {
            return null;
        }

        return new AuthenticatedUser($verified->userId, $verified->role, $verified->tenantId);
    }
}
