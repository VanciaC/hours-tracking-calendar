<?php

namespace App\Services;

use App\Repositories\Contracts\EntryTemplateRepositoryInterface;
use Illuminate\Support\Enumerable;

/**
 * Business logic for entry templates.
 *
 * Authorization is handled upstream: ownership in App\GraphQL\Entities\User.
 */
final class EntryTemplateService
{
    public function __construct(
        private readonly EntryTemplateRepositoryInterface $entryTemplateRepository,
    ) {}

    public function getUserTemplates(int $userId): Enumerable
    {
        return $this->entryTemplateRepository->findByUser($userId);
    }
}