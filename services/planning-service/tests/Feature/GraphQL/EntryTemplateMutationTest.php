<?php declare(strict_types=1);

namespace Tests\Feature\GraphQL;

use App\Auth\AuthenticatedUser;
use App\Models\EntryTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Nuwave\Lighthouse\Testing\MakesGraphQLRequests;
use Tests\TestCase;

final class EntryTemplateMutationTest extends TestCase
{
    use MakesGraphQLRequests;
    use RefreshDatabase;

    private const CREATE = /** @lang GraphQL */ '
        mutation ($input: EntryTemplateInput!) {
            createEntryTemplate(input: $input) {
                id
                durationMinutes
                isDefault
                slots { startTime endTime unpaidBreakMinutes }
            }
        }
    ';

    private const UPDATE = /** @lang GraphQL */ '
        mutation ($id: ID!, $input: EntryTemplateInput!) {
            updateEntryTemplate(id: $id, input: $input) { id }
        }
    ';

    private const DELETE = /** @lang GraphQL */ '
        mutation ($id: ID!) {
            deleteEntryTemplate(id: $id) { id }
        }
    ';

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(new AuthenticatedUser(7), 'jwt');
    }

    public function test_it_creates_a_slots_template_with_its_net_duration(): void
    {
        $this->graphQL(self::CREATE, ['input' => [
            'label' => 'Journée standard',
            'mode' => 'SLOTS',
            'slots' => [['startTime' => '08:00', 'endTime' => '15:00']],
        ]])
            ->assertJsonPath('data.createEntryTemplate.durationMinutes', 420)
            ->assertJsonPath('data.createEntryTemplate.slots.0.startTime', '08:00')
            ->assertJsonPath('data.createEntryTemplate.slots.0.unpaidBreakMinutes', 0);

        $this->assertDatabaseHas('entry_templates', ['user_id' => 7, 'label' => 'Journée standard']);
    }

    public function test_a_new_default_template_replaces_the_previous_default(): void
    {
        $previous = EntryTemplate::factory()->forUser(7)->asDefault()->create();

        $this->graphQL(self::CREATE, ['input' => [
            'label' => 'Mi-temps',
            'mode' => 'DURATION',
            'durationMinutes' => 210,
            'isDefault' => true,
        ]])->assertJsonPath('data.createEntryTemplate.isDefault', true);

        $this->assertFalse($previous->fresh()->is_default);
        $this->assertSame(1, EntryTemplate::query()->where('user_id', 7)->where('is_default', true)->count());
    }

    public function test_it_does_not_update_someone_else_template(): void
    {
        $template = EntryTemplate::factory()->forUser(8)->create(['label' => 'Not mine']);

        $this->graphQL(self::UPDATE, ['id' => $template->id, 'input' => [
            'label' => 'Hijacked',
            'mode' => 'DURATION',
            'durationMinutes' => 60,
        ]])->assertGraphQLErrorMessage("Entry template {$template->id} not found.");

        $this->assertSame('Not mine', $template->fresh()->label);
    }

    public function test_it_deletes_an_own_template(): void
    {
        $template = EntryTemplate::factory()->forUser(7)->create();

        $this->graphQL(self::DELETE, ['id' => $template->id])
            ->assertJsonPath('data.deleteEntryTemplate.id', (string) $template->id);

        $this->assertModelMissing($template);
    }
}