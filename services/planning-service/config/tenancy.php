<?php

declare(strict_types=1);

return [

    /*
     * Each company is reached on {slug}.{base_domain}. An access token is only accepted
     * on its own company's address.
     */
    'base_domain' => env('TENANCY_BASE_DOMAIN', 'localhost'),

];
