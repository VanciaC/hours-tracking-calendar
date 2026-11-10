<?php declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Models\WorkDay;
use Illuminate\Database\Eloquent\Collection;

/** Résout User.workDays pour la référence d'entité User. */
final class UserWorkDays
{
    /**
     * @param  array{id: string}  $root
     * @param  array{from: \Illuminate\Support\Carbon, to: \Illuminate\Support\Carbon}  $args
     *
     * @return Collection<int, WorkDay>
     */
    public function __invoke(array $root, array $args): Collection
    {
        return WorkDay::query()
            ->where('user_id', $root['id'])
            ->whereBetween('date', [$args['from']->toDateString(), $args['to']->toDateString()])
            ->orderBy('date')
            ->get();
    }
}
