<?php declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\HourlyRate;
use App\Repositories\Contracts\HourlyRateRepositoryInterface;
use App\Services\HourlyRateService;
use Illuminate\Support\Carbon;
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
    
    public function test_it_saves_the_rate_through_the_repository(): void
    {
        $date = Carbon::parse('2026-12-01');
        $expected = new HourlyRate();

        $repository = $this->createMock(HourlyRateRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('saveForDate')
            ->with(1, $date, 1350)
            ->willReturn($expected);

        $service = new HourlyRateService($repository);

        $this->assertSame($expected, $service->setRate(1, $date, 1350));
    }
}