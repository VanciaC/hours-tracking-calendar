<?php declare(strict_types=1);

namespace App\GraphQL\Entities;

/**
 * Résolveur d'entité pour User dans planning-service.
 *
 * Ce service n'a pas de table users, l'utilisateur appartient à auth-service.
 * On se contente de renvoyer la référence (son id), les champs propres à
 * ce service (workDays) sont résolus à partir de là.
 */
final class User
{
    /**
     * @param  array{__typename: string, id: string}  $representation
     *
     * @return array{__typename: string, id: string}
     */
    public function __invoke(array $representation): array
    {
        // __typename est requis par Lighthouse pour résoudre l'union _Entity
        // quand le résultat est un tableau et non un modèle Eloquent.
        return [
            '__typename' => 'User',
            'id' => $representation['id'],
        ];
    }
}
