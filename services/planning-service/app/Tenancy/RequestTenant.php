<?php

declare(strict_types=1);

namespace App\Tenancy;

use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;

/**
 * Reads the company subdomain the browser asked for: dupont.ton-domaine.fr → "dupont".
 */
final class RequestTenant
{
    /** Lowercase letters, digits and inner dashes, 1 to 63 characters: a valid DNS label. */
    private const SLUG_PATTERN = '/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/';

    public function __construct(
        #[Config('tenancy.base_domain')]
        private readonly string $baseDomain,
    ) {}

    /**
     * Null outside a company address: the bare domain, a deeper subdomain or another domain.
     */
    public function slug(Request $request): ?string
    {
        // Behind Caddy, the router or the Vite proxy, the browser's address arrives in X-Forwarded-Host.
        $forwarded = $request->headers->get('X-Forwarded-Host');
        $host = $forwarded !== null ? trim(explode(',', $forwarded)[0]) : $request->getHost();
        $host = mb_strtolower(explode(':', $host)[0]);

        $suffix = '.'.$this->baseDomain;

        if (! str_ends_with($host, $suffix)) {
            return null;
        }

        $slug = substr($host, 0, -strlen($suffix));

        return preg_match(self::SLUG_PATTERN, $slug) === 1 ? $slug : null;
    }
}
