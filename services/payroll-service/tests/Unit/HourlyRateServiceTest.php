<?php declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use App\Services\HourlyRateService;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

final class HourlyRateServiceTest extends TestCase
{
    public function test_it_returns_the_rate_history_found_by_the_repository(): void
    {
        $expected = new Collection();

        $repository = $this->createMock(HourlyRateRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findByUser')
            ->with(1)
            ->willReturn($expected);

        $service = new HourlyRateService($repository);

        $this->assertSame($expected, $service->getUserRateHistory(1));
    }
}