<?php

declare(strict_types=1);

namespace App\Auth;

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
    ) {}

    public function __invoke(Request $request): ?AuthenticatedUser
    {
        $token = $request->bearerToken();

        if ($token === null) {
            return null;
        }

        $userId = $this->jwtVerifier->verify($token);

        return $userId === null ? null : new AuthenticatedUser($userId);
    }
}
