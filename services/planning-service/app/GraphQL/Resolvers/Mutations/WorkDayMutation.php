<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\DataTransferObjects\ShiftData;
use App\Models\WorkDay;
use App\Services\WorkDayService;
use Carbon\CarbonInterface;
use Illuminate\Support\Enumerable;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Work day mutations. The target user is always the authenticated one:
 * it is never taken from the arguments, so nobody can edit someone else's days.
 */
final class WorkDayMutation
{
    public function __construct(
        private readonly WorkDayService $workDayService,
    ) {}

    /**
     * @param array{input: array{
     *     date: CarbonInterface,
     *     mode: string,
     *     durationMinutes?: int|null,
     *     shifts?: list<array{startTime: string, endTime: string, unpaidBreakMinutes?: int}>,
     *     note?: string|null,
     * }} $args
     */
    public function saveWorkDay(mixed $root, array $args, GraphQLContext $context): WorkDay
    {
        $input = $args['input'];

        return $this->workDayService->saveDay(
            $this->requesterId($context),
            $input['date'],
            $input['mode'],
            $input['durationMinutes'] ?? null,
            array_map(ShiftData::fromArray(...), $input['shifts'] ?? []),
            $input['note'] ?? null,
        );
    }

    /**
     * @param array{
     *     dates: list<CarbonInterface>,
     *     hours: array{
     *         mode: string,
     *         durationMinutes?: int|null,
     *         shifts?: list<array{startTime: string, endTime: string, unpaidBreakMinutes?: int}>,
     *         note?: string|null,
     *     },
     * } $args
     * @return Enumerable<int, WorkDay>
     */
    public function saveWorkDays(mixed $root, array $args, GraphQLContext $context): Enumerable
    {
        $hours = $args['hours'];

        return $this->workDayService->saveDays(
            $this->requesterId($context),
            $args['dates'],
            $hours['mode'],
            $hours['durationMinutes'] ?? null,
            array_map(ShiftData::fromArray(...), $hours['shifts'] ?? []),
            $hours['note'] ?? null,
        );
    }

    /**
     * @param  array{id: string}  $args
     */
    public function deleteWorkDay(mixed $root, array $args, GraphQLContext $context): WorkDay
    {
        return $this->workDayService->deleteDay($this->requesterId($context), (int) $args['id']);
    }

    private function requesterId(GraphQLContext $context): int
    {
        $user = $context->user();

        // @guard already rejects anonymous requests; this keeps the resolver safe on its own.
        if ($user === null) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return (int) $user->getAuthIdentifier();
    }
}
