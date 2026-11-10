<?php declare(strict_types=1);

namespace App\GraphQL\Federation;

use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Federation\Resolvers\Service;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Resolver de `_service { sdl }`.
 *
 * Lighthouse instancie le resolver d'origine via le conteneur Laravel.
 * Il suffit donc de le lier à cette classe dans un service provider.
 */
class FederationV2Service extends Service
{
    /**
     * @param  array<string, mixed>  $args  Toujours vide
     *
     * @return array{sdl: string}
     */
    public function __invoke(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): array
    {
        return [
            'sdl' => FederationV2Printer::print($resolveInfo->schema),
        ];
    }
}
