<?php

declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Enums\Role;
use App\Models\HourlyRate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

/**
 * Each company only sees its own pay data.
 */
final class TenancyTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const RATES_OF_USER = /** @lang GraphQL */ '
        query ($representations: [_Any!]!) {
            _entities(representations: $representations) {
                ... on User { hourlyRates { amountCents } }
            }
        }
    ';

    public function test_an_admin_never_sees_the_rates_of_another_company(): void
    {
        HourlyRate::factory()->forUser(7)->amount(1300)->create();

        $representations = [['__typename' => 'User', 'id' => '7']];

        // An admin of the same company sees them.
        $this->actingAs(new AuthenticatedUser(1, Role::Admin, tenantId: 1), 'jwt')
            ->graphQL(self::RATES_OF_USER, ['representations' => $representations])
            ->assertJsonPath('data._entities.0.hourlyRates.0.amountCents', 1300);

        // An admin of another company guessing the id gets nothing.
        $this->actingAs(new AuthenticatedUser(2, Role::Admin, tenantId: 2), 'jwt')
            ->graphQL(self::RATES_OF_USER, ['representations' => $representations])
            ->assertJsonCount(0, 'data._entities.0.hourlyRates');
    }

    public function test_rates_of_another_company_are_invisible(): void
    {
        $this->actAsTenant(2);
        HourlyRate::factory()->forUser(7)->create();

        $this->actAsTenant(1);

        $this->assertSame(0, HourlyRate::query()->count());
    }

    public function test_new_rates_belong_to_the_current_company(): void
    {
        $this->actAsTenant(5);

        $rate = HourlyRate::factory()->forUser(7)->create();

        $this->assertSame(5, $rate->tenant_id);
    }
}
