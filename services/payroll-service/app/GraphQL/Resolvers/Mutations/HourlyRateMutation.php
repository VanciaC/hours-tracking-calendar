<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers\Mutations;

use App\Models\HourlyRate;
use App\Services\HourlyRateService;
use Carbon\CarbonInterface;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

/**
 * Hourly rate mutations. The target user is always the authenticated one:
 * it is never taken from the arguments, so nobody can edit someone else's rates.
 */
final class HourlyRateMutation
{
    public function __construct(
        private readonly HourlyRateService $hourlyRateService,
    ) {}

    /**
     * @param array{amountCents: int, effectiveFrom: CarbonInterface} $args
     */
    public function setHourlyRate(mixed $root, array $args, GraphQLContext $context): HourlyRate
    {
        return $this->hourlyRateService->setRate(
            $this->requesterId($context),
            $args['effectiveFrom'],
            $args['amountCents'],
        );
    }

    /**
     * @param array{id: string, amountCents: int, effectiveFrom: CarbonInterface} $args
     */
    public function updateHourlyRate(mixed $root, array $args, GraphQLContext $context): HourlyRate
    {
        return $this->hourlyRateService->updateRate(
            $this->requesterId($context),
            (int) $args['id'],
            $args['effectiveFrom'],
            $args['amountCents'],
        );
    }

    /**
     * @param array{id: string} $args
     */
    public function deleteHourlyRate(mixed $root, array $args, GraphQLContext $context): HourlyRate
    {
        return $this->hourlyRateService->deleteRate(
            $this->requesterId($context),
            (int) $args['id'],
        );
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