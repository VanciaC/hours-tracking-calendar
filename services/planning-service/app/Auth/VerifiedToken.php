<?php

declare(strict_types=1);

namespace App\Auth;

use App\Enums\Role;

/**
 * What a valid access token tells about its owner.
 */
final readonly class VerifiedToken
{
    public function __construct(
        public int $userId,
        public Role $role,
        /** Id of the user's company, stored on every row of this service. */
        public int $tenantId,
        /** Its subdomain: the token is only accepted on that address. */
        public string $tenantSlug,
    ) {}
}
