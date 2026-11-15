<?php declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\LoginResult;
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
     */
    public function login(string $email, string $password): LoginResult
    {
        $user = $this->userRepository->findByEmail($email);

        if ($user === null || ! $this->hasher->check($password, $user->password)) {
            throw new InvalidCredentialsException();
        }

        return new LoginResult($user, $this->tokenService->issueFor($user));
    }
}