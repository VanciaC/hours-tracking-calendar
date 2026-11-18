<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ForbiddenException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Enumerable;

/**
 * Read-only access of administrators to the other users (US-27, US-28, RG-12).
 */
final class UserAdministrationService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * @return LengthAwarePaginator<int, User>
     *
     * @throws ForbiddenException when the requester is not an admin
     */
    public function listUsers(User $requester, ?string $search, int $page, int $perPage): LengthAwarePaginator
    {
        $this->ensureAdmin($requester);

        return $this->userRepository->paginateRegularUsers($search === null ? null : trim($search), $page, $perPage);
    }

    /**
     * A non-admin user, null when unknown or admin: an admin never sees another admin's data (RG-12).
     *
     * @throws ForbiddenException when the requester is not an admin
     */
    public function findUser(User $requester, int $id): ?User
    {
        $this->ensureAdmin($requester);

        return $this->userRepository->findRegularUser($id);
    }

    /**
     * Everyone who can record hours, admins included, for the team schedule.
     * Only names and ids are meant for this list: details and pay of another
     * admin stay out of reach through findUser (RG-12).
     *
     * @return Enumerable<int, User>
     *
     * @throws ForbiddenException when the requester is not an admin
     */
    public function listTeamMembers(User $requester): Enumerable
    {
        $this->ensureAdmin($requester);

        return $this->userRepository->findVerifiedUsers();
    }

    private function ensureAdmin(User $requester): void
    {
        if (! $requester->isAdmin()) {
            throw new ForbiddenException;
        }
    }
}
