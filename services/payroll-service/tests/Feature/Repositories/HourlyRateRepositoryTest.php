<?php declare(strict_types=1);

namespace Tests\Feature\Repositories;

use App\Models\HourlyRate;
use App\Repositories\HourlyRateRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class HourlyRateRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private HourlyRateRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->app->make(HourlyRateRepository::class);
    }

    public function test_it_returns_only_the_user_rates_most_recent_first(): void
    {
        HourlyRate::factory()->forUser(1)->effectiveFrom('2026-01-01')->amount(1250)->create();
        HourlyRate::factory()->forUser(1)->effectiveFrom('2026-11-01')->amount(1300)->create();
        HourlyRate::factory()->forUser(2)->effectiveFrom('2026-06-01')->amount(1500)->create(); // another user

        $rates = $this->repository->findByUser(1);

        $this->assertSame([1300, 1250], $rates->pluck('amount_cents')->all());
    }

    public function test_it_returns_an_empty_collection_when_the_user_has_no_rate(): void
    {
        HourlyRate::factory()->forUser(2)->create();

        $this->assertTrue($this->repository->findByUser(1)->isEmpty());
    }
}