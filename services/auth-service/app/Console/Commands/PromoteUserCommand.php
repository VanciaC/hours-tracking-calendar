<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Commands\Concerns\SelectsTenant;
use App\Enums\Role;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Tenancy\CurrentTenant;
use Illuminate\Console\Command;

/**
 * Gives or removes the admin role in a company (RG-13). The change reaches the other
 * services when the user's access token is renewed: within 15 minutes.
 */
final class PromoteUserCommand extends Command
{
    use SelectsTenant;

    protected $signature = 'user:promote
        {email : Email address of the user}
        {--tenant= : Subdomain of the company, e.g. dupont}
        {--revoke : Remove the admin role instead}';

    protected $description = 'Give the admin role to a user of a company, or remove it with --revoke';

    public function handle(
        UserRepositoryInterface $userRepository,
        TenantRepositoryInterface $tenantRepository,
        CurrentTenant $currentTenant,
    ): int {
        $tenant = $this->selectTenant($tenantRepository, $currentTenant);

        if ($tenant === null) {
            return self::FAILURE;
        }

        $email = mb_strtolower((string) $this->argument('email'));
        // The same address may have an account in another company: only this company's is looked up.
        $user = $userRepository->findByEmail($email);

        if ($user === null) {
            $this->error("No user with the email {$email} in {$tenant->name}.");

            return self::FAILURE;
        }

        $role = $this->option('revoke') ? Role::User : Role::Admin;
        $userRepository->setRole($user, $role);

        $this->info("{$email} now has the {$role->value} role in {$tenant->name}.");

        return self::SUCCESS;
    }
}
