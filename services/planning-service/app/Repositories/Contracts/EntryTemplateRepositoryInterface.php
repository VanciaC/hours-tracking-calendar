<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Enumerable;

interface EntryTemplateRepositoryInterface
{
    /**
     * Get every entry template owned by the given user.
     */
    public function findByUser(int $userId): Enumerable;
}