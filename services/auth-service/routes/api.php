<?php

declare(strict_types=1);

use App\Http\Controllers\SessionController;
use App\Http\Controllers\TenantController;
use App\Http\Middleware\EnsureJsonRequest;
use Illuminate\Support\Facades\Route;

/*
 * Session endpoints, under the /auth prefix (see bootstrap/app.php).
 */
Route::middleware(EnsureJsonRequest::class)->group(function (): void {
    Route::post('/login', [SessionController::class, 'login']);
    Route::post('/verify-email', [SessionController::class, 'verifyEmail']);
    Route::post('/refresh', [SessionController::class, 'refresh']);
    Route::post('/logout', [SessionController::class, 'logout']);
});

// Read-only and without a body: outside the JSON-only group, which guards against cross-site posts.
Route::get('/tenant', [TenantController::class, 'show']);
