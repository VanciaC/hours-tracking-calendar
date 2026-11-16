<?php

declare(strict_types=1);

namespace App\GraphQL\Entities;

use App\Exceptions\AccessDeniedException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;

/**
 * Entity resolver for the federated User type.
 *
 * planning-service has no users table: the user belongs to auth-service.
 * We only return the reference (its id), and the fields this service owns
 * (workDays, entryTemplates) are resolved from it by App\GraphQL\Resolvers\Types\UserTypeResolver.
 *
 * This is the only way into a User in this service (the router calls _entities),
 * so it is also where ownership is enforced: a user can only resolve themself.
 * Any field added to User is therefore protected without extra code.
 * If a query ever returns User directly, it must enforce the same rule.
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
     * @throws AccessDeniedException when the token belongs to another user
     */
    public function __invoke(array $representation): array
    {
        $requester = $this->auth->guard()->user();

        // Also covers null: no token, or an invalid one.
        if (! $requester instanceof Authenticatable) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        // The representation id is a string ("1"), the token id an int (1).
        if ((string) $requester->getAuthIdentifier() !== (string) $representation['id']) {
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
