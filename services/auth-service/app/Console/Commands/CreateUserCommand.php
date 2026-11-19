<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Commands\Concerns\SelectsTenant;
use App\Enums\Role;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Rules\EmailFreeInCompany;
use App\Tenancy\CurrentTenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Creates a verified account in a company from the server, for example its first admin
 * when no email can be sent. The password is typed in a hidden prompt: it never appears
 * in the shell history.
 */
final class CreateUserCommand extends Command
{
    use SelectsTenant;

    protected $signature = 'user:create
        {email : Email address}
        {name : Display name}
        {--tenant= : Subdomain of the company, e.g. dupont}
        {--admin : Give the admin role}
        {--locale=fr : Language of the emails (fr, en, ja, ar)}';

    protected $description = 'Create a verified user in a company, optionally with the admin role';

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
        $name = (string) $this->argument('name');
        $locale = (string) $this->option('locale');

        $validator = Validator::make(
            ['email' => $email, 'name' => $name, 'locale' => $locale],
            [
                'email' => ['required', 'email', 'max:255', new EmailFreeInCompany],
                'name' => ['required', 'string', 'max:100'],
                'locale' => ['required', 'in:fr,en,ja,ar'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (at least 8 characters)');

        if (mb_strlen($password) < 8 || $password !== (string) $this->secret('Confirm the password')) {
            $this->error('The password is too short, or the confirmation does not match.');

            return self::FAILURE;
        }

        $user = $userRepository->create($name, $email, $password, $locale);
        $userRepository->markEmailVerified($user);

        if ($this->option('admin')) {
            $userRepository->setRole($user, Role::Admin);
        }

        $this->info("User {$email} created in {$tenant->name} (id {$user->id})".($this->option('admin') ? ', with the admin role.' : '.'));

        return self::SUCCESS;
    }
}
