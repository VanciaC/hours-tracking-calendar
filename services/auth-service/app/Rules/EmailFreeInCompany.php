<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * The address has no account yet in the current company. It may have one in another company.
 */
final class EmailFreeInCompany implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Limited to the current company by the tenant scope of the User model.
        if (is_string($value) && User::query()->where('email', mb_strtolower($value))->exists()) {
            $fail('validation.unique')->translate();
        }
    }
}
