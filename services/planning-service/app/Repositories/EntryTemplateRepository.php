<?php

namespace App\Repositories;

use App\Models\EntryTemplate;
use App\Repositories\Contracts\EntryTemplateRepositoryInterface;
use Illuminate\Support\Enumerable;

final class EntryTemplateRepository implements EntryTemplateRepositoryInterface
{
    public function findByUser(int $userId): Enumerable
    {
        return EntryTemplate::query()
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get();
    }
}