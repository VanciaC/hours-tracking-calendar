<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Models\User;
use App\Services\RegistrationService;

/**
 * Sign-up and email verification mutations.
 */
final class RegistrationMutation
{
    public function __construct(
        private readonly RegistrationService $registrationService,
    ) {}

    /**
     * Mutation.register
     *
     * @param  array{name: string, email: string, password: string, passwordConfirmation: string, locale?: string|null}  $args
     * @return array{email: string}
     */
    public function register(mixed $root, array $args): array
    {
        $user = $this->registrationService->register(
            $args['name'],
            $args['email'],
            $args['password'],
            $args['locale'] ?? 'en',
        );

        return ['email' => $user->email];
    }

    /**
     * Mutation.verifyEmail
     *
     * @param  array{token: string}  $args
     * @return array{accessToken: string, tokenType: string, expiresIn: int, user: User}
     */
    public function verifyEmail(mixed $root, array $args): array
    {
        $result = $this->registrationService->verifyEmail($args['token']);

        return [
            'accessToken' => $result->token->accessToken,
            'tokenType' => 'Bearer',
            'expiresIn' => $result->token->expiresIn,
            'user' => $result->user,
        ];
    }

    /**
     * Mutation.resendVerificationEmail
     *
     * @param  array{email: string}  $args
     */
    public function resendVerificationEmail(mixed $root, array $args): bool
    {
        $this->registrationService->resendVerificationEmail($args['email']);

        // Always true: the answer must not reveal whether the address has an account.
        return true;
    }
}
