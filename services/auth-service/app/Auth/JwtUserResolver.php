<?php

declare(strict_types=1);

namespace App\Auth;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
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
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function __invoke(Request $request): ?User
    {
        $token = $request->bearerToken();

        if ($token === null) {
            return null;
        }

        $verified = $this->jwtVerifier->verify($token);

        // The role is read from the database here, not from the token: a change applies at once in auth-service.
        return $verified === null ? null : $this->userRepository->findById($verified->userId);
    }
}
