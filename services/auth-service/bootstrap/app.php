<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // Session endpoints: /auth/login, /auth/refresh...
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'auth',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Every request, GraphQL included, runs in the company of its subdomain.
        $middleware->append(ResolveTenant::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Wrong passwords and expired sessions are expected outcomes, not errors to log.
        $exceptions->dontReport([ApiException::class]);

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('auth/*') || $request->expectsJson(),
        );
    })->create();
