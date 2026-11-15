<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers\Queries;

use App\Models\User;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * User queries.
 */
final class UserQuery
{
    /**
     * Query.me
     *
     * Returns null until the JWT guard is wired (US-01, step 2).
     */
    public function me(mixed $root, array $args, GraphQLContext $context): ?User
    {
        $user = $context->user();

        return $user instanceof User ? $user : null;
    }
}