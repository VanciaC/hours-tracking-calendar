<?php

declare(strict_types=1);

return [

    /*
     * Path to the RSA public key used to verify access tokens issued by auth-service.
     */
    'public_key_path' => env('JWT_PUBLIC_KEY_PATH'),

    /*
     * Expected value of the "iss" claim.
     */
    'issuer' => env('JWT_ISSUER', 'hours-tracking-calendar-auth'),

];
