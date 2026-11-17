<?php

return [

    /*
     * Public sign-up (US-03). When false, accounts can only be created on the server.
     */
    'enabled' => (bool) env('REGISTRATION_ENABLED', true),

    /*
     * Lifetime of the link sent to verify the email address (US-22).
     */
    'verification_ttl_hours' => (int) env('EMAIL_VERIFICATION_TTL_HOURS', 24),

    /*
     * Base URL of the front end: the verification link opens a page there.
     */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

];
