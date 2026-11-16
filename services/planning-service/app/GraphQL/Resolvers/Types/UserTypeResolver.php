<?php

namespace App\GraphQL\Resolvers\Types;

use App\Models\EntryTemplate;
use App\Models\WorkDay;
use App\Services\EntryTemplateService;
use App\Services\WorkDayService;
use Illuminate\Support\Enumerable;

/**
 * Field resolvers for the federated User entity.
 *
 * $root is the representation returned by App\GraphQL\Entities\User,
 * which has already checked that the requester owns this user.
 */
final class UserTypeResolver
{
    public function __construct(
        private readonly WorkDayService $workDayService,
        private readonly EntryTemplateService $entryTemplateService,
    ) {}

    /**
     * @param  array<string, mixed>  $root
     * @param  array<string, mixed>  $args
     * @return Enumerable<int, WorkDay>
     */
    public function workDays(array $root, array $args): Enumerable
    {
        return $this->workDayService->getUserWorkDaysBetween(
            (int) $root['id'],
            $args['from'],
            $args['to'],
        );
    }

    /**
     * @param  array<string, mixed>  $root
     * @return Enumerable<int, EntryTemplate>
     */
    public function entryTemplates(array $root): Enumerable
    {
        return $this->entryTemplateService->getUserTemplates((int) $root['id']);
    }
}
