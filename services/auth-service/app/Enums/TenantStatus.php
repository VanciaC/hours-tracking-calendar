<?php

declare(strict_types=1);

namespace App\Enums;

enum TenantStatus: string
{
    /** The company's people can sign in. */
    case Active = 'active';

    /** Nobody from the company can sign in, but nothing is deleted. */
    case Suspended = 'suspended';
}
