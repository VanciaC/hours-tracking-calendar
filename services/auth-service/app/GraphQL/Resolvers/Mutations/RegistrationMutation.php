<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Services\RegistrationService;

/**
 * Sign-up mutations. Verifying the email signs the user in, so it lives in /auth/verify-email.
 */
final class RegistrationMutation
{
    public function __construct(
        private readonly RegistrationService $registrationService,
    ) {}

    /**
     * Mutation.register
     *
     * @param  array{name: string, email: string, password: string, passwordConfirmation: string, locale?: string|null, invitationToken?: string|null}  $args
     * @return array{email: string, verified: bool}
     */
    public function register(mixed $root, array $args): array
    {
        $user = $this->registrationService->register(
            $args['name'],
            $args['email'],
            $args['password'],
            $args['locale'] ?? 'en',
            $args['invitationToken'] ?? null,
        );

        return [
            'email' => $user->email,
            'verified' => $user->email_verified_at !== null,
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
