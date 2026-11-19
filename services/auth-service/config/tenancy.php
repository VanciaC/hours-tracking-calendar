<?php

declare(strict_types=1);

return [

    /*
     * Each company is reached on {slug}.{base_domain}: dupont.localhost in development,
     * dupont.ton-domaine.fr in production.
     */
    'base_domain' => env('TENANCY_BASE_DOMAIN', 'localhost'),

];
