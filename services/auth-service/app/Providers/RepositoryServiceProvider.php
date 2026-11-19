<?php

declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\EmailVerificationTokenRepositoryInterface;
use App\Repositories\Contracts\InvitationRepositoryInterface;
use App\Repositories\Contracts\PasswordResetTokenRepositoryInterface;
use App\Repositories\Contracts\RefreshTokenRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EmailVerificationTokenRepository;
use App\Repositories\InvitationRepository;
use App\Repositories\PasswordResetTokenRepository;
use App\Repositories\RefreshTokenRepository;
use App\Repositories\TenantRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Binds repository contracts to their implementations.
 */
final class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(EmailVerificationTokenRepositoryInterface::class, EmailVerificationTokenRepository::class);
        $this->app->bind(RefreshTokenRepositoryInterface::class, RefreshTokenRepository::class);
        $this->app->bind(PasswordResetTokenRepositoryInterface::class, PasswordResetTokenRepository::class);
        $this->app->bind(InvitationRepositoryInterface::class, InvitationRepository::class);
        $this->app->bind(TenantRepositoryInterface::class, TenantRepository::class);
    }
}
