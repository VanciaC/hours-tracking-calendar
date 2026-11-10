<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\User;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final class Me
{
    /** @param  array<string, mixed>  $args */
    public function __invoke(mixed $root, array $args, GraphQLContext $context): ?User
    {
        $user = $context->user();

        return $user instanceof User ? $user : null;
    }
}
