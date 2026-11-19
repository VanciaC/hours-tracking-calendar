<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Who may create an account (US-33).
 */
enum RegistrationMode: string
{
    /** Anyone, from the sign-up page. */
    case Open = 'open';

    /** Only people invited by an admin, from the emailed link. */
    case Invite = 'invite';

    /** Nobody, accounts are only created on the server. */
    case Closed = 'closed';

    /**
     * An unknown or misspelled value falls back to invitations, the safe choice.
     */
    public static function fromConfig(string $value): self
    {
        return self::tryFrom(mb_strtolower(trim($value))) ?? self::Invite;
    }
}
