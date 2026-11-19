<?php

use App\Http\Controllers\TlsController;
use Illuminate\Support\Facades\Route;

// API uniquement. Le point d'entrée GraphQL est /graphql (enregistré par Lighthouse).
Route::get('/', fn () => response()->json([
    'service' => 'auth-service',
    'graphql' => url('/graphql'),
]));

// Asked by Caddy before getting an HTTPS certificate (see TlsController). Never forwarded from outside.
Route::get('/internal/tls-allowed', [TlsController::class, 'allowed']);
