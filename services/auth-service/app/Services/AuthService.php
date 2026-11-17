<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\LoginResult;
use App\Exceptions\EmailNotVerifiedException;
use App\Exceptions\InvalidCredentialsException;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Hashing\Hasher;

/**
 * Authentication use cases.
 */
final class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly Hasher $hasher,
        private readonly TokenService $tokenService,
    ) {}

    /**
     * @throws InvalidCredentialsException when the email is unknown or the password is wrong
     * @throws EmailNotVerifiedException when the credentials are right but the email is not verified (RG-11)
     */
    public function login(string $email, string $password): LoginResult
    {
        $user = $this->userRepository->findByEmail(mb_strtolower($email));

        if ($user === null || ! $this->hasher->check($password, $user->password)) {
            throw new InvalidCredentialsException;
        }

        // Checked after the password, so this message never reveals that an address exists.
        if ($user->email_verified_at === null) {
            throw new EmailNotVerifiedException;
        }

        return new LoginResult($user, $this->tokenService->issueFor($user));
    }
}
