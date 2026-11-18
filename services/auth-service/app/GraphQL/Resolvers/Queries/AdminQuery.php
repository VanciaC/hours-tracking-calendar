<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Queries;

use App\Models\User;
use App\Services\UserAdministrationService;
use Illuminate\Support\Enumerable;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Administration queries (US-27, US-28). Admins only, read-only.
 */
final class AdminQuery
{
    public function __construct(
        private readonly UserAdministrationService $userAdministrationService,
    ) {}

    /**
     * Query.adminUsers
     *
     * @param  array{search?: string|null, page: int, perPage: int}  $args
     * @return array{items: array<int, User>, total: int, page: int, lastPage: int}
     */
    public function adminUsers(mixed $root, array $args, GraphQLContext $context): array
    {
        $users = $this->userAdministrationService->listUsers(
            $this->requester($context),
            $args['search'] ?? null,
            $args['page'],
            $args['perPage'],
        );

        return [
            'items' => $users->items(),
            'total' => $users->total(),
            'page' => $users->currentPage(),
            'lastPage' => $users->lastPage(),
        ];
    }

    /**
     * Query.adminUser
     *
     * @param  array{id: string}  $args
     */
    public function adminUser(mixed $root, array $args, GraphQLContext $context): ?User
    {
        return $this->userAdministrationService->findUser($this->requester($context), (int) $args['id']);
    }

    /**
     * Query.teamMembers
     *
     * @param  array<string, never>  $args  no arguments
     * @return Enumerable<int, User>
     */
    public function teamMembers(mixed $root, array $args, GraphQLContext $context): Enumerable
    {
        return $this->userAdministrationService->listTeamMembers($this->requester($context));
    }

    private function requester(GraphQLContext $context): User
    {
        $user = $context->user();

        if (! $user instanceof User) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return $user;
    }
}
