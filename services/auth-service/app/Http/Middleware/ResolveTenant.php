<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Finds the company from the subdomain the browser asked for: dupont.ton-domaine.fr → "dupont".
 *
 * Every request needs a company, except the health check and the subgraph schema,
 * which Rover and the router fetch from inside the network.
 *
 * The subdomain only chooses where to look. Security does not rest on it: queries are
 * limited to the company, and an access token only finds its user in its own company.
 */
final class ResolveTenant
{
    /** The subgraph schema query, the only GraphQL request allowed without a company. */
    private const SDL_QUERY = '/^\s*(query\s+\w*\s*)?\{\s*_service\s*\{\s*sdl\s*\}\s*\}\s*$/';

    public function __construct(
        private readonly TenantRepositoryInterface $tenantRepository,
        private readonly CurrentTenant $currentTenant,
        #[Config('tenancy.base_domain')]
        private readonly string $baseDomain,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->needsNoTenant($request)) {
            return $next($request);
        }

        $slug = $this->slugFrom($this->browserHost($request));
        $tenant = $slug === null ? null : $this->tenantRepository->findBySlug($slug);

        if ($tenant === null) {
            return new JsonResponse(['message' => 'Unknown company.', 'code' => 'TENANT_NOT_FOUND'], 404);
        }

        if (! $tenant->isActive()) {
            return new JsonResponse(['message' => 'This company is suspended.', 'code' => 'TENANT_SUSPENDED'], 403);
        }

        // Restored afterwards, so one request never leaves its company behind for the next one.
        $previous = $this->currentTenant->get();
        $this->currentTenant->set($tenant);

        try {
            return $next($request);
        } finally {
            $previous === null ? $this->currentTenant->forget() : $this->currentTenant->set($previous);
        }
    }

    private function needsNoTenant(Request $request): bool
    {
        if ($request->is('up')) {
            return true;
        }

        $query = $request->input('query');

        return $request->is('graphql') && is_string($query) && preg_match(self::SDL_QUERY, $query) === 1;
    }

    /**
     * Behind Caddy, the router or the Vite proxy, the address typed in the browser
     * arrives in X-Forwarded-Host. Without a proxy, it is the Host header itself.
     */
    private function browserHost(Request $request): string
    {
        $forwarded = $request->headers->get('X-Forwarded-Host');
        $host = $forwarded !== null ? trim(explode(',', $forwarded)[0]) : $request->getHost();

        // Without the port: dupont.localhost:5173 → dupont.localhost.
        return mb_strtolower(explode(':', $host)[0]);
    }

    /**
     * "dupont" for dupont.ton-domaine.fr. Null for the bare domain, a deeper subdomain
     * (a.b.ton-domaine.fr) or another domain.
     */
    private function slugFrom(string $host): ?string
    {
        $suffix = '.'.$this->baseDomain;

        if (! str_ends_with($host, $suffix)) {
            return null;
        }

        $slug = substr($host, 0, -strlen($suffix));

        return preg_match(Tenant::SLUG_PATTERN, $slug) === 1 ? $slug : null;
    }
}
