# Hours Tracking Calendar

Application perso pour saisir ses heures de travail dans un calendrier, suivre ses totaux et estimer son salaire brut.

C'est aussi un projet d'entraînement sur Laravel, GraphQL (Lighthouse), Apollo Federation 2, React et Docker.
Les user stories sont dans [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

## Architecture

```
frontend (React + Vite + Apollo Client)      :5173
        │
router (Apollo Router v2, supergraph local)  :4000
   ├── auth-service      Laravel + Lighthouse  :8001   User, connexion
   ├── planning-service  Laravel + Lighthouse  :8002   WorkDay, Shift, EntryTemplate
   └── payroll-service   Laravel + Lighthouse  :8003   HourlyRate, salaire
        │
mysql 8.4 (une base par service)            :3307
```

Chaque service Laravel est un sous-graphe Federation 2. Lighthouse gère Federation 2 nativement depuis la v6.23.
Le dossier `app/GraphQL/Federation` de chaque service contient un override du printer de `_service { sdl }`,
pour que `@inaccessible` et `@tag` soient aussi transmis au router quand ils sont posés ailleurs que sur un type objet ou un champ
(enums, inputs, arguments, unions, scalaires, interfaces).

## Prérequis

- Docker et Docker Compose
- [Rover](https://www.apollographql.com/docs/rover/getting-started), seulement pour recomposer le supergraph

## Démarrer

```bash
cp .env.example .env
docker compose up -d --build
```

Au premier lancement, chaque service fait son `composer install`, crée son `.env`, génère sa clé et lance ses migrations.
Compte quelques minutes, le temps que les healthchecks passent au vert (`docker compose ps`).

| URL | Quoi |
|---|---|
| http://localhost:5173 | Front React |
| http://localhost:4000 | Router + Sandbox Apollo pour tester les requêtes |
| http://localhost:8001/graphql | auth-service seul |
| http://localhost:8002/graphql | planning-service seul |
| http://localhost:8003/graphql | payroll-service seul |

## Modifier un schéma GraphQL

1. Modifier `services/<service>/graphql/schema.graphql`
2. Recomposer le supergraph (les services doivent tourner)

   ```bash
   ./scripts/compose-supergraph.sh
   ```

Le fichier `router/supergraph.graphql` est commité pour que la stack démarre directement après un clone.

## Commandes utiles

```bash
make up            # démarre la stack
make down          # arrête la stack
make logs          # suit les logs
make test          # lance les tests des 3 services
make supergraph    # recompose le supergraph
make fresh         # remet les bases à zéro (migrate:fresh)
```

## État du projet

Initialisation. Squelette des services, schémas de départ, migrations et Docker.
Les user stories (connexion JWT, saisie, totaux, salaire) arrivent ensuite, une par une.

## Pistes pour plus tard

- Image Docker de prod (code copié dans l'image, FrankenPHP ou php-fpm), `php artisan serve` ne sert qu'au dev
- Factoriser l'override Federation 2 dans un package Composer partagé entre les services
- Utilisateur MySQL distinct par service
- CI GitHub Actions (tests + composition du supergraph)
