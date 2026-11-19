<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\EmailNotVerifiedException;
use App\Exceptions\InvalidCredentialsException;
use App\Exceptions\TooManyLoginAttemptsException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Tenancy\CurrentTenant;
use Illuminate\Cache\RateLimiter;
use Illuminate\Contracts\Hashing\Hasher;

/**
 * Authentication use cases.
 */
final class AuthService
{
    /** Failed attempts allowed per address and IP, within DECAY_SECONDS (US-01). */
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 60;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly Hasher $hasher,
        private readonly RateLimiter $rateLimiter,
        private readonly CurrentTenant $currentTenant,
    ) {}

    /**
     * Checks the credentials of a sign-in attempt, among the accounts of the current company only.
     *
     * @throws TooManyLoginAttemptsException after too many failures for this address from this IP
     * @throws InvalidCredentialsException when the email is unknown or the password is wrong
     * @throws EmailNotVerifiedException when the credentials are right but the email is not verified (RG-11)
     */
    public function authenticate(string $email, string $password, string $ip): User
    {
        $email = mb_strtolower($email);
        // Company, address and IP together: one company's failures never block the same address elsewhere,
        // and an attacker cannot lock someone out from another network.
        $key = 'login:'.sha1($this->currentTenant->require()->id.'|'.$email.'|'.$ip);

        if ($this->rateLimiter->tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw new TooManyLoginAttemptsException($this->rateLimiter->availableIn($key));
        }

        // Limited to the current company by the tenant scope of the User model.
        $user = $this->userRepository->findByEmail($email);

        if ($user === null || ! $this->hasher->check($password, $user->password)) {
            $this->rateLimiter->hit($key, self::DECAY_SECONDS);

            throw new InvalidCredentialsException;
        }

        $this->rateLimiter->clear($key);

        // Checked after the password, so this message never reveals that an address exists.
        if ($user->email_verified_at === null) {
            throw new EmailNotVerifiedException;
        }

        return $user;
    }
}
