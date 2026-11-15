<?php declare(strict_types=1);

namespace App\Providers;

use App\Auth\AuthenticatedUser;
use App\Auth\JwtUserResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

/**
 * Registers the "jwt" authentication guard.
 */
final class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // The resolver is built lazily, only when the guard is used,
        // so a misconfigured key does not break unrelated requests.
        Auth::viaRequest(
            'jwt',
            fn (Request $request): ?AuthenticatedUser => $this->app->make(JwtUserResolver::class)($request),
        );
    }
}