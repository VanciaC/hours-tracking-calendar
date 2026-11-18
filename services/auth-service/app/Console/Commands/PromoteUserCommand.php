<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\Role;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Console\Command;

/**
 * Gives or removes the admin role (RG-13). The change reaches the other services
 * when the user's access token is renewed: within 15 minutes.
 */
final class PromoteUserCommand extends Command
{
    protected $signature = 'user:promote
        {email : Email address of the user}
        {--revoke : Remove the admin role instead}';

    protected $description = 'Give the admin role to a user, or remove it with --revoke';

    public function handle(UserRepositoryInterface $userRepository): int
    {
        $email = mb_strtolower((string) $this->argument('email'));
        $user = $userRepository->findByEmail($email);

        if ($user === null) {
            $this->error("No user with the email {$email}.");

            return self::FAILURE;
        }

        $role = $this->option('revoke') ? Role::User : Role::Admin;
        $userRepository->setRole($user, $role);

        $this->info("{$email} now has the {$role->value} role.");

        return self::SUCCESS;
    }
}
