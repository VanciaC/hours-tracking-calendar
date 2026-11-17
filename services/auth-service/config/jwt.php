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
     * Access token lifetime, in minutes. Short on purpose: it cannot be revoked (RG-14).
     */
    'ttl_minutes' => (int) env('JWT_TTL_MINUTES', 15),

    /*
     * Value of the "iss" claim, checked by every service when verifying a token.
     */
    'issuer' => env('JWT_ISSUER', 'hours-tracking-calendar-auth'),

    /*
     * Refresh token lifetime, in days. Renewed at each use (RG-14).
     */
    'refresh_ttl_days' => (int) env('JWT_REFRESH_TTL_DAYS', 30),

    /*
     * A token exchanged less than this many seconds ago may be used again:
     * two tabs refreshing at the same time is not a theft.
     */
    'refresh_reuse_grace_seconds' => 10,

    /*
     * Cookie holding the refresh token: httpOnly, SameSite=Strict, sent only to /auth.
     * Secure must stay true in production (HTTPS). Turned off for local HTTP.
     */
    'refresh_cookie_name' => 'htc_refresh',
    'refresh_cookie_secure' => (bool) env('REFRESH_COOKIE_SECURE', true),

];
