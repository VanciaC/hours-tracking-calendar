<?php

declare(strict_types=1);

return [

    /*
     * Path to the RSA private key used to sign access tokens.
     * Only auth-service has it.
     */
    'private_key_path' => env('JWT_PRIVATE_KEY_PATH'),

    /*
     * Path to the RSA public key used to verify access tokens.
     */
    'public_key_path' => env('JWT_PUBLIC_KEY_PATH'),

    /*
     * Access token lifetime, in minutes.
     */
    'ttl_minutes' => (int) env('JWT_TTL_MINUTES', 120),

    /*
     * Value of the "iss" claim, checked by every service when verifying a token.
     */
    'issuer' => env('JWT_ISSUER', 'hours-tracking-calendar-auth'),

];
