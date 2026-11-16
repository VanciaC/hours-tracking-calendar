<?php

namespace App\Repositories;

use App\Models\EntryTemplate;
use App\Repositories\Contracts\EntryTemplateRepositoryInterface;
use Illuminate\Support\Enumerable;
use Illuminate\Support\Facades\DB;

final class EntryTemplateRepository implements EntryTemplateRepositoryInterface
{
    public function findByUser(int $userId): Enumerable
    {
        return EntryTemplate::query()
            ->where('user_id', $userId)
            ->orderByDesc('is_default')
            ->orderByDesc('usage_count')
            ->orderBy('id')
            ->get();
    }

    public function findForUser(int $id, int $userId): ?EntryTemplate
    {
        return EntryTemplate::query()
            ->whereKey($id)
            ->where('user_id', $userId)
            ->first();
    }

    public function saveForUser(int $userId, ?EntryTemplate $template, array $attributes): EntryTemplate
    {
        return DB::transaction(function () use ($userId, $template, $attributes): EntryTemplate {
            // Only one default template per user (RG-04).
            if ($attributes['is_default'] ?? false) {
                EntryTemplate::query()
                    ->where('user_id', $userId)
                    ->when($template !== null, fn ($query) => $query->whereKeyNot($template->id))
                    ->update(['is_default' => false]);
            }

            $template ??= new EntryTemplate(['user_id' => $userId]);
            $template->fill($attributes)->save();

            return $template;
        });
    }

    public function delete(EntryTemplate $template): void
    {
        $template->delete();
    }
}