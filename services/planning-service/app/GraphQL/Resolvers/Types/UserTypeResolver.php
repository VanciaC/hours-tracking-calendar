<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers\Types;

use App\Models\WorkDay;
use App\Services\WorkDayService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Enumerable;

/**
 * Resolves the fields planning-service contributes to the federated User type.
 */
final class UserTypeResolver
{
    public function __construct(
        private readonly WorkDayService $workDayService,
    ) {}

    /**
     * User.workDays
     *
     * @param  array{id: string}  $root  User reference built by App\GraphQL\Entities\User
     * @param  array{from: Carbon, to: Carbon}  $args
     *
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
}