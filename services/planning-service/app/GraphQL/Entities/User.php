<?php

declare(strict_types=1);

namespace App\GraphQL\Entities;

use App\Auth\AuthenticatedUser;
use App\Exceptions\AccessDeniedException;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;

/**
 * Entity resolver for the federated User type.
 *
 * This service has no users table: the user belongs to auth-service.
 * We only return the reference (its id), and the fields this service owns
 * are resolved from it by App\GraphQL\Resolvers\Types\UserTypeResolver.
 *
 * This is the only way into a User in this service (the router calls _entities),
 * so it is also where access is enforced: a user can only resolve themself,
 * and an admin can resolve anyone. Any field added to User is therefore
 * protected without extra code. If a query ever returns User directly,
 * it must enforce the same rule.
 *
 * Admin access is read-only by design: mutations never take a user id,
 * they always write the requester's own data.
 */
final class User
{
    public function __construct(
        private readonly AuthFactory $auth,
    ) {}

    /**
     * @param  array{__typename: string, id: string}  $representation
     * @return array{__typename: string, id: string}
     *
     * @throws AuthenticationException when no valid token was sent
     * @throws AccessDeniedException when the token belongs to another user who is not an admin
     */
    public function __invoke(array $representation): array
    {
        $requester = $this->auth->guard()->user();

        // Also covers null: no token, or an invalid one.
        if (! $requester instanceof AuthenticatedUser) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        // The representation id is a string ("1"), the token id an int (1).
        $isOwner = (string) $requester->id === (string) $representation['id'];

        if (! $isOwner && ! $requester->isAdmin()) {
            throw AccessDeniedException::notOwner();
        }

        // __typename is required by Lighthouse to resolve the _Entity union
        // when the result is an array rather than an Eloquent model.
        return [
            '__typename' => 'User',
            'id' => $representation['id'],
        ];
    }
}
