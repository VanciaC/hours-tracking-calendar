<?php declare(strict_types=1);

namespace App\GraphQL\Entities;

/**
 * Entity resolver for the federated User type.
 *
 * payroll-service has no users table: the user belongs to auth-service.
 * We only return the reference (its id), and the fields this service owns
 * (hourlyRates) are resolved from it by App\GraphQL\Resolvers\Types\UserTypeResolver.
 *
 * Lighthouse looks up this class by convention (App\GraphQL\Entities\{TypeName})
 * when the router calls _entities.
 */
final class User
{
    /**
     * @param  array{__typename: string, id: string}  $representation
     *
     * @return array{__typename: string, id: string}
     */
    public function __invoke(array $representation): array
    {
        // __typename is required by Lighthouse to resolve the _Entity union
        // when the result is an array rather than an Eloquent model.
        return [
            '__typename' => 'User',
            'id' => $representation['id'],
        ];
    }
}