<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Queries;

use App\Models\Invitation;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Support\Enumerable;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Sign-up mode and invitations (US-33).
 */
final class InvitationQuery
{
    public function __construct(
        private readonly InvitationService $invitationService,
    ) {}

    /**
     * Query.registrationMode, public: the front end shows or hides the sign-up link with it.
     *
     * @param  array<string, never>  $args  no arguments
     */
    public function registrationMode(mixed $root, array $args): string
    {
        return $this->invitationService->mode()->value;
    }

    /**
     * Query.invitation, public: prefills the sign-up form from the emailed link.
     *
     * @param  array{token: string}  $args
     * @return array{email: string}|null
     */
    public function invitation(mixed $root, array $args): ?array
    {
        $invitation = $this->invitationService->findPending($args['token']);

        return $invitation === null ? null : ['email' => $invitation->email];
    }

    /**
     * Query.invitations, admins only.
     *
     * @param  array<string, never>  $args  no arguments
     * @return Enumerable<int, Invitation>
     */
    public function invitations(mixed $root, array $args, GraphQLContext $context): Enumerable
    {
        $user = $context->user();

        if (! $user instanceof User) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return $this->invitationService->list($user);
    }
}
