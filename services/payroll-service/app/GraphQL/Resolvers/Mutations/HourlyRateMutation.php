<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Models\HourlyRate;
use App\Services\HourlyRateService;
use Carbon\CarbonInterface;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final class HourlyRateMutation
{
    public function __construct(
        private readonly HourlyRateService $hourlyRateService,
    ) {}

    /**
     * The rate is always saved for the authenticated user: the target user
     * is never taken from the arguments, so nobody can edit someone else's rate.
     *
     * @param array{amountCents: int, effectiveFrom: CarbonInterface} $args
     */
    public function setHourlyRate(mixed $root, array $args, GraphQLContext $context): HourlyRate
    {
        $user = $context->user();

        // @guard already rejects anonymous requests; this keeps the resolver safe on its own.
        if ($user === null) {
            throw new AuthenticationException(AuthenticationException::MESSAGE);
        }

        return $this->hourlyRateService->setRate(
            (int) $user->getAuthIdentifier(),
            $args['effectiveFrom'],
            $args['amountCents'],
        );
    }
}