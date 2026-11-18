<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Queries;

use App\Auth\AuthenticatedUser;
use App\Models\WorkDay;
use App\Services\WorkDayService;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Enumerable;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;

/**
 * Admin queries over the whole team.
 */
final class TeamQuery
{
    public function __construct(
        private readonly AuthFactory $auth,
        private readonly WorkDayService $workDayService,
    ) {}

    /**
     * @param  array{from: Carbon, to: Carbon}  $args
     * @return Enumerable<int, WorkDay>
     */
    public function teamWorkDays(mixed $root, array $args): Enumerable
    {
        $requester = $this->auth->guard()->user();

        // @guard already refuses anonymous calls, this keeps the type narrow.
        if (! $requester instanceof AuthenticatedUser) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return $this->workDayService->getTeamWorkDaysBetween($requester, $args['from'], $args['to']);
    }
}
