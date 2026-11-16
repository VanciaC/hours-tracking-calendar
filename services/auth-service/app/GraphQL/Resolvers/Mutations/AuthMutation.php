<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Models\User;
use App\Services\AuthService;

/**
 * Authentication mutations.
 */
final class AuthMutation
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    /**
     * Mutation.login
     *
     * @param  array{email: string, password: string}  $args
     * @return array{accessToken: string, tokenType: string, expiresIn: int, user: User}
     */
    public function login(mixed $root, array $args): array
    {
        $result = $this->authService->login($args['email'], $args['password']);

        return [
            'accessToken' => $result->token->accessToken,
            'tokenType' => 'Bearer',
            'expiresIn' => $result->token->expiresIn,
            'user' => $result->user,
        ];
    }
}
