<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class SetHourlyRateMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const MUTATION = /** @lang GraphQL */ '
        mutation ($amountCents: Int!, $effectiveFrom: Date!) {
            setHourlyRate(amountCents: $amountCents, effectiveFrom: $effectiveFrom) {
                amountCents
                effectiveFrom
            }
        }
    ';

    public function test_it_saves_the_rate_for_the_authenticated_user(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $this->graphQL(self::MUTATION, ['amountCents' => 1350, 'effectiveFrom' => '2026-12-01'])
            ->assertJsonPath('data.setHourlyRate.amountCents', 1350)
            ->assertJsonPath('data.setHourlyRate.effectiveFrom', '2026-12-01');

        $this->assertDatabaseHas('hourly_rates', [
            'user_id' => 7,
            'amount_cents' => 1350,
            'effective_from' => '2026-12-01',
        ]);
    }

    public function test_it_rejects_anonymous_requests(): void
    {
        $this->graphQL(self::MUTATION, ['amountCents' => 1350, 'effectiveFrom' => '2026-12-01'])
            ->assertGraphQLErrorMessage('Unauthenticated.');

        $this->assertDatabaseCount('hourly_rates', 0);
    }

    public function test_it_rejects_a_non_positive_amount(): void
    {
        $this->actingAs(new AuthenticatedUser(7), 'jwt');

        $this->graphQL(self::MUTATION, ['amountCents' => 0, 'effectiveFrom' => '2026-12-01'])
            ->assertGraphQLValidationKeys(['amountCents']);

        $this->assertDatabaseCount('hourly_rates', 0);
    }
}
