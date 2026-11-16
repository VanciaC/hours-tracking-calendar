<?php

namespace App\Repositories\Contracts;

use App\Models\EntryTemplate;
use Illuminate\Support\Enumerable;

interface EntryTemplateRepositoryInterface
{
    /**
     * Get every entry template owned by the given user.
     *
     * @return Enumerable<int, EntryTemplate>
     */
    public function findByUser(int $userId): Enumerable;

    /**
     * Find a template only if it belongs to the given user.
     */
    public function findForUser(int $id, int $userId): ?EntryTemplate;

    /**
     * Create a template for the user (when $template is null) or update it.
     * When it becomes the default, the user's previous default loses that status (RG-04).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function saveForUser(int $userId, ?EntryTemplate $template, array $attributes): EntryTemplate;

    public function delete(EntryTemplate $template): void;
}
