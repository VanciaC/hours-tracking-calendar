<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Models\Invitation;
use App\Models\User;
use App\Services\InvitationService;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Invitations sent by admins (US-33).
 */
final class InvitationMutation
{
    public function __construct(
        private readonly InvitationService $invitationService,
    ) {}

    /**
     * Mutation.createInvitation
     *
     * @param  array{email: string}  $args
     */
    public function createInvitation(mixed $root, array $args, GraphQLContext $context): Invitation
    {
        return $this->invitationService->invite($this->requester($context), $args['email']);
    }

    /**
     * Mutation.resendInvitation
     *
     * @param  array{id: string}  $args
     */
    public function resendInvitation(mixed $root, array $args, GraphQLContext $context): Invitation
    {
        return $this->invitationService->resend($this->requester($context), (int) $args['id']);
    }

    /**
     * Mutation.revokeInvitation
     *
     * @param  array{id: string}  $args
     */
    public function revokeInvitation(mixed $root, array $args, GraphQLContext $context): bool
    {
        return $this->invitationService->revoke($this->requester($context), (int) $args['id']);
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
