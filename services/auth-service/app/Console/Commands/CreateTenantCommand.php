<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Exceptions\EmailAlreadyRegisteredException;
use App\Exceptions\RegistrationDisabledException;
use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Services\InvitationService;
use App\Tenancy\CurrentTenant;
use App\Tenancy\FrontendUrl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Creates a client company and invites its first admin, who then invites the employees.
 */
final class CreateTenantCommand extends Command
{
    protected $signature = 'tenant:create
        {slug : Subdomain of the company, e.g. dupont for dupont.ton-domaine.fr}
        {name : Name of the company, e.g. "Boulangerie Dupont"}
        {--admin= : Email of its first admin, who receives an invitation}
        {--locale=fr : Language of the invitation email (fr, en, ja, ar)}';

    protected $description = 'Create a company, and invite its first admin';

    public function handle(
        TenantRepositoryInterface $tenantRepository,
        InvitationService $invitationService,
        CurrentTenant $currentTenant,
        FrontendUrl $frontendUrl,
    ): int {
        $slug = mb_strtolower(trim((string) $this->argument('slug')));
        $name = trim((string) $this->argument('name'));
        $adminOption = $this->option('admin');
        $admin = is_string($adminOption) ? mb_strtolower(trim($adminOption)) : null;
        $locale = (string) $this->option('locale');

        $validator = Validator::make(
            ['slug' => $slug, 'name' => $name, 'admin' => $admin, 'locale' => $locale],
            [
                'slug' => ['required', 'regex:'.Tenant::SLUG_PATTERN, Rule::notIn(Tenant::RESERVED_SLUGS), 'unique:tenants,slug'],
                'name' => ['required', 'string', 'max:100'],
                'admin' => ['nullable', 'email', 'max:255'],
                'locale' => ['required', 'in:fr,en,ja,ar'],
            ],
            ['slug.regex' => 'The slug may only hold lowercase letters, digits and inner dashes, 63 characters at most.'],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $tenant = $tenantRepository->create($slug, $name);

        // The invitation belongs to the new company. Restored afterwards, for the tests.
        $previous = $currentTenant->get();
        $currentTenant->set($tenant);

        try {
            $this->info("Company \"{$name}\" created: ".$frontendUrl->to('/'));

            if ($admin === null) {
                $this->line("No admin invited. Later: php artisan user:create <email> \"<name>\" --tenant={$slug} --admin");

                return self::SUCCESS;
            }

            $invitationService->inviteFirstAdmin($admin, config()->string('app.name'), $locale);
            $this->info("Invitation sent to {$admin}: the account created from it will be an admin.");
        } catch (RegistrationDisabledException) {
            $this->warn('Sign-up is closed (REGISTRATION_MODE=closed): no invitation was sent.');
        } catch (EmailAlreadyRegisteredException) {
            $this->warn("{$admin} already has an account in this company: no invitation was sent.");
        } finally {
            $previous === null ? $currentTenant->forget() : $currentTenant->set($previous);
        }

        return self::SUCCESS;
    }
}
