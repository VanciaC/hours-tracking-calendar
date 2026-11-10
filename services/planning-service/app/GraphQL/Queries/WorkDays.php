<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\WorkDay;
use Illuminate\Database\Eloquent\Collection;

final class WorkDays
{
    /**
     * @param  array{from: \Illuminate\Support\Carbon, to: \Illuminate\Support\Carbon}  $args
     *
     * @return Collection<int, WorkDay>
     */
    public function __invoke(mixed $root, array $args): Collection
    {
        // TODO US-01 : filtrer sur l'utilisateur authentifié (RG-01).
        return WorkDay::query()
            ->whereBetween('date', [$args['from']->toDateString(), $args['to']->toDateString()])
            ->orderBy('date')
            ->get();
    }
}
