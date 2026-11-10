<?php

use Illuminate\Support\Facades\Route;

// API uniquement. Le point d'entrée GraphQL est /graphql (enregistré par Lighthouse).
Route::get('/', fn () => response()->json([
    'service' => 'auth-service',
    'graphql' => url('/graphql'),
]));
