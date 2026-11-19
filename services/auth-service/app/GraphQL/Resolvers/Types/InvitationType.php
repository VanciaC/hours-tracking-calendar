<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Types;

use App\Models\Invitation;

/**
 * Computed fields of the Invitation type.
 */
final class InvitationType
{
    /**
     * Invitation.status: worked out from the dates, never stored.
     *
     * @param  array<string, never>  $args  no arguments
     */
    public function status(Invitation $root, array $args): string
    {
        return $root->status()->value;
    }
}
