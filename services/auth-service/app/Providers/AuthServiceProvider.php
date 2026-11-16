<?php

declare(strict_types=1);

namespace App\Providers;

use App\Auth\JwtUserResolver;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

/**
 * Registers the "jwt" authentication guard.
 */
final class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Auth::viaRequest('jwt', $this->app->make(JwtUserResolver::class));
    }
}
