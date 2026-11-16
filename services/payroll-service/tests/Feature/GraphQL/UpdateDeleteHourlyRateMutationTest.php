<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Models\HourlyRate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class UpdateDeleteHourlyRateMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const UPDATE = /** @lang GraphQL */ '
        mutation ($id: ID!, $amountCents: Int!, $effectiveFrom: Date!) {
            updateHourlyRate(id: $id, amountCents: $amountCents, effectiveFrom: $effectiveFrom) {
                id
                amountCents
                effectiveFrom
            }
        }
    ';

    private const DELETE = /** @lang GraphQL */ '
        mutation ($id: ID!) {
            deleteHourlyRate(id: $id) { id }
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(new AuthenticatedUser(7), 'jwt');
    }

    public function test_it_updates_the_amount_and_the_date_of_an_own_rate(): void
    {
        $rate = HourlyRate::factory()->forUser(7)->effectiveFrom('2026-11-15')->amount(1280)->create();

        $this->graphQL(self::UPDATE, ['id' => $rate->id, 'amountCents' => 1290, 'effectiveFrom' => '2026-11-16'])
            ->assertJsonPath('data.updateHourlyRate.amountCents', 1290)
            ->assertJsonPath('data.updateHourlyRate.effectiveFrom', '2026-11-16');

        $this->assertDatabaseHas('hourly_rates', [
            'id' => $rate->id,
            'amount_cents' => 1290,
            'effective_from' => '2026-11-16',
        ]);
    }

    public function test_it_does_not_update_someone_else_rate(): void
    {
        $rate = HourlyRate::factory()->forUser(8)->effectiveFrom('2026-11-15')->amount(1280)->create();

        $this->graphQL(self::UPDATE, ['id' => $rate->id, 'amountCents' => 1, 'effectiveFrom' => '2026-11-15'])
            ->assertGraphQLErrorMessage("Hourly rate {$rate->id} not found.");

        $this->assertDatabaseHas('hourly_rates', ['id' => $rate->id, 'amount_cents' => 1280]);
    }

    public function test_it_refuses_to_move_a_rate_onto_a_taken_date(): void
    {
        HourlyRate::factory()->forUser(7)->effectiveFrom('2026-11-01')->create();
        $rate = HourlyRate::factory()->forUser(7)->effectiveFrom('2026-11-15')->create();

        $this->graphQL(self::UPDATE, ['id' => $rate->id, 'amountCents' => 1300, 'effectiveFrom' => '2026-11-01'])
            ->assertGraphQLErrorMessage('An hourly rate already exists on 2026-11-01.');
    }

    public function test_it_deletes_an_own_rate(): void
    {
        $rate = HourlyRate::factory()->forUser(7)->create();

        $this->graphQL(self::DELETE, ['id' => $rate->id])
            ->assertJsonPath('data.deleteHourlyRate.id', (string) $rate->id);

        $this->assertModelMissing($rate);
    }

    public function test_it_does_not_delete_someone_else_rate(): void
    {
        $rate = HourlyRate::factory()->forUser(8)->create();

        $this->graphQL(self::DELETE, ['id' => $rate->id])
            ->assertGraphQLErrorMessage("Hourly rate {$rate->id} not found.");

        $this->assertModelExists($rate);
    }
}
