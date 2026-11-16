<?php

declare(strict_types=1);

namespace Tests\Feature\Repositories;

use App\Models\EntryTemplate;
use App\Repositories\EntryTemplateRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class EntryTemplateRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EntryTemplateRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EntryTemplateRepository;
    }

    public function test_it_returns_only_the_user_templates_default_first_then_most_used(): void
    {
        $rarelyUsed = EntryTemplate::factory()->forUser(1)->usedTimes(1)->create();
        $oftenUsed = EntryTemplate::factory()->forUser(1)->usedTimes(10)->create();
        $default = EntryTemplate::factory()->forUser(1)->asDefault()->usedTimes(0)->create();
        EntryTemplate::factory()->forUser(2)->asDefault()->usedTimes(50)->create();

        $templates = $this->repository->findByUser(1);

        $this->assertSame(
            [$default->id, $oftenUsed->id, $rarelyUsed->id],
            $templates->pluck('id')->all(),
        );
    }

    public function test_it_returns_an_empty_collection_when_the_user_has_no_template(): void
    {
        EntryTemplate::factory()->forUser(2)->create();

        $this->assertTrue($this->repository->findByUser(1)->isEmpty());
    }
}
