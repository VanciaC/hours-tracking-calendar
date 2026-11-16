<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Repositories\Contracts\EntryTemplateRepositoryInterface;
use App\Services\EntryTemplateService;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

final class EntryTemplateServiceTest extends TestCase
{
    public function test_it_returns_the_templates_found_by_the_repository(): void
    {
        $expected = new Collection;

        $repository = $this->createMock(EntryTemplateRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findByUser')
            ->with(1)
            ->willReturn($expected);

        $service = new EntryTemplateService($repository);

        $this->assertSame($expected, $service->getUserTemplates(1));
    }
}
