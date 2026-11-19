<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Asked by Caddy before it gets an HTTPS certificate for an address (on-demand TLS).
 *
 * Only the bare domain and the subdomains of existing companies get one: otherwise anyone
 * could make the server request certificates for made-up names, until the certificate
 * authority blocks it. Suspended companies keep theirs, so their page can say so.
 *
 * Reached from inside the Docker network only: Caddy never forwards /internal from the outside.
 */
final class TlsController
{
    public function __construct(
        private readonly TenantRepositoryInterface $tenantRepository,
        #[Config('tenancy.base_domain')]
        private readonly string $baseDomain,
    ) {}

    /**
     * GET /internal/tls-allowed?domain=dupont.ton-domaine.fr
     */
    public function allowed(Request $request): Response
    {
        $domain = mb_strtolower((string) $request->query('domain', ''));

        if ($domain === $this->baseDomain) {
            return new Response('', 200);
        }

        $suffix = '.'.$this->baseDomain;
        $slug = str_ends_with($domain, $suffix) ? substr($domain, 0, -strlen($suffix)) : '';

        $allowed = preg_match(Tenant::SLUG_PATTERN, $slug) === 1
            && $this->tenantRepository->findBySlug($slug) !== null;

        return new Response('', $allowed ? 200 : 404);
    }
}
