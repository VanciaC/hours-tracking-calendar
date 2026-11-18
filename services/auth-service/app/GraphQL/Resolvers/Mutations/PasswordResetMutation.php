<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Services\PasswordResetService;

/**
 * Forgotten password mutations (US-24). Public: the person cannot sign in.
 */
final class PasswordResetMutation
{
    public function __construct(
        private readonly PasswordResetService $passwordResetService,
    ) {}

    /**
     * Mutation.requestPasswordReset
     *
     * @param  array{email: string}  $args
     */
    public function requestPasswordReset(mixed $root, array $args): bool
    {
        $this->passwordResetService->requestReset($args['email']);

        // Always true: the answer must not reveal whether the address has an account.
        return true;
    }

    /**
     * Mutation.resetPassword
     *
     * @param  array{token: string, password: string, passwordConfirmation: string}  $args
     */
    public function resetPassword(mixed $root, array $args): bool
    {
        $this->passwordResetService->resetPassword($args['token'], $args['password']);

        return true;
    }
}
