<?php declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\EntryTemplateData;
use App\DataTransferObjects\ShiftData;
use App\Exceptions\EntryTemplateNotFoundException;
use App\Exceptions\InvalidWorkDayException;
use App\Models\EntryTemplate;
use App\Models\WorkDay;
use App\Repositories\Contracts\EntryTemplateRepositoryInterface;
use Illuminate\Support\Enumerable;

/**
 * Business logic for entry templates.
 *
 * Reads are authorized upstream (ownership in App\GraphQL\Entities\User);
 * writes by id check ownership here with a user-scoped lookup.
 */
final class EntryTemplateService
{
    public function __construct(
        private readonly EntryTemplateRepositoryInterface $entryTemplateRepository,
        private readonly WorkTimeCalculator $calculator = new WorkTimeCalculator(),
    ) {}

    public function getUserTemplates(int $userId): Enumerable
    {
        return $this->entryTemplateRepository->findByUser($userId);
    }

    /**
     * Create a template, or update one of the user's templates when an id is given.
     *
     * @throws EntryTemplateNotFoundException when the template is not the user's
     * @throws InvalidWorkDayException when the duration or the slots break a rule
     */
    public function saveTemplate(int $userId, ?int $templateId, EntryTemplateData $data): EntryTemplate
    {
        $template = $templateId === null ? null : $this->findOwnedTemplate($userId, $templateId);

        return $this->entryTemplateRepository->saveForUser($userId, $template, $this->attributesFor($data));
    }

    /**
     * @throws EntryTemplateNotFoundException when the template is not the user's
     */
    public function deleteTemplate(int $userId, int $templateId): EntryTemplate
    {
        $template = $this->findOwnedTemplate($userId, $templateId);

        $this->entryTemplateRepository->delete($template);

        return $template;
    }

    private function findOwnedTemplate(int $userId, int $templateId): EntryTemplate
    {
        return $this->entryTemplateRepository->findForUser($templateId, $userId)
            ?? throw EntryTemplateNotFoundException::withId($templateId);
    }

    /**
     * Same rules as a work day; the net duration is stored in both modes.
     *
     * @return array<string, mixed>
     */
    private function attributesFor(EntryTemplateData $data): array
    {
        $isSlots = $data->mode === WorkDay::MODE_SLOTS;

        return [
            'label' => $data->label,
            'mode' => $data->mode,
            'duration_minutes' => $isSlots
                ? $this->calculator->netMinutes($data->slots)
                : $this->calculator->checkDuration($data->durationMinutes),
            'slots' => $isSlots
                ? array_map(static fn (ShiftData $slot): array => $slot->toArray(), $data->slots)
                : null,
            'is_default' => $data->isDefault,
        ];
    }
}