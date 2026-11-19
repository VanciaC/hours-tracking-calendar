<?php

declare(strict_types=1);

namespace App\Tenancy;

use Illuminate\Config\Repository as ConfigRepository;

/**
 * Builds links to the front end of the current company, for the emails.
 */
final class FrontendUrl
{
    public function __construct(
        private readonly CurrentTenant $currentTenant,
        private readonly ConfigRepository $config,
    ) {}

    /**
     * @param  array<string, string>  $query
     */
    public function to(string $path, array $query = []): string
    {
        $base = str_replace(
            '{tenant}',
            $this->currentTenant->require()->slug,
            $this->config->string('registration.frontend_url'),
        );

        $url = rtrim($base, '/').'/'.ltrim($path, '/');

        return $query === [] ? $url : $url.'?'.http_build_query($query);
    }
}
