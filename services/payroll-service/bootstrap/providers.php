<?php

use App\Providers\AppServiceProvider;
use App\Providers\FederationV2ServiceProvider;
use App\Providers\RepositoryServiceProvider;
use Nuwave\Lighthouse\Federation\FederationServiceProvider;

return [
    AppServiceProvider::class,
    FederationServiceProvider::class,
    FederationV2ServiceProvider::class,
    RepositoryServiceProvider::class,
];
