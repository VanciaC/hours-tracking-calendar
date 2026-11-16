<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers\Types;

use App\Models\EntryTemplate;

final class EntryTemplateTypeResolver
{
    /**
     * Stored slots use snake_case keys; GraphQL exposes them in camelCase.
     *
     * @return list<array{startTime: string, endTime: string, unpaidBreakMinutes: int}>
     */
    public function slots(EntryTemplate $template): array
    {
        return array_map(
            static fn (array $slot): array => [
                'startTime' => $slot['start_time'],
                'endTime' => $slot['end_time'],
                'unpaidBreakMinutes' => $slot['unpaid_break_minutes'],
            ],
            $template->slots ?? [],
        );
    }
}
