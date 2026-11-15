# Hours Tracking Calendar

Personal app to log working hours on a calendar, track weekly and monthly totals and estimate gross pay.

It is also a practice project on Laravel, GraphQL (Lighthouse), Apollo Federation 2, React and Docker.
User stories: [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

## Architecture

```
frontend (React + Vite + Apollo Client)       :5173
        │
router (Apollo Router v2, local supergraph)   :4000
   ├── auth-service      Laravel + Lighthouse   :8001   users, login, JWT
   ├── planning-service  Laravel + Lighthouse   :8002   work days, shifts, entry templates
   └── payroll-service   Laravel + Lighthouse   :8003   hourly rates, pay
        │
mysql 8.4 (one database per service)          :3307
```

Each Laravel service is a Federation 2 subgraph. The `User` entity is owned by auth-service;
planning and payroll add their own fields to it (`User.workDays`, `User.hourlyRates`).

### Code layers (inside each service)

```
GraphQL resolver   app/GraphQL/Resolvers/{Queries,Mutations,Types}   reads args, calls a service
      │
Service            app/Services                                      business rules
      │  through an interface (app/Repositories/Contracts)
Repository         app/Repositories                                  database access (Eloquent)
```

Repository interfaces are bound to their implementations in `app/Providers/RepositoryServiceProvider.php`.

## Requirements

- Docker Desktop with WSL 2 integration
- **On Windows, clone the project inside WSL** (e.g. `~/projects`), not on `C:\`.
  Bind mounts from the Windows filesystem are too slow for `composer install`.
- [Rover](https://www.apollographql.com/docs/rover/getting-started), only to recompose the supergraph
- `make` (`sudo apt install make`)

## Getting started

```bash
cp .env.example .env

# JWT signing keys (never committed)
mkdir -p secrets/jwt
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt/private.pem
openssl pkey -in secrets/jwt/private.pem -pubout -out secrets/jwt/public.pem

make up      # first start takes a few minutes (composer install, migrations)
make ps      # wait until the three Laravel services are "healthy"
make seed    # demo data
```

| URL | What |
|---|---|
| http://localhost:5173 | React front end |
| http://localhost:4000 | Router + Apollo Sandbox |
| http://localhost:8001/graphql | auth-service alone |
| http://localhost:8002/graphql | planning-service alone |
| http://localhost:8003/graphql | payroll-service alone |

## Demo data

`make seed` fills the **development** databases (`auth`, `planning`, `payroll`):

- a demo user, **`test@example.com` / `password`** (id 1)
- a work day for every weekday from the start of last month until today
- two hourly rates: one from the start of the year, a raise from the start of the current month

Seeders are idempotent: you can run `make seed` again at any time.

Log in from the Sandbox (http://localhost:4000):

```graphql
mutation {
  login(email: "test@example.com", password: "password") {
    accessToken
    expiresIn
    user { id name }
  }
}
```

Then add the header `Authorization: Bearer <accessToken>` in the Sandbox **Headers** tab for the next requests.

### Resetting the data

| Command | Effect |
|---|---|
| `make fresh` | drops every table, reruns the migrations and the seeders |
| `make reset` | deletes all Docker volumes (MySQL included) and restarts from scratch, then run `make seed` |

## Tests

```bash
make test                                         # every service
docker compose exec planning-service php artisan test   # one service
```

Tests run on dedicated MySQL databases (`auth_testing`, `planning_testing`, `payroll_testing`),
never on the development ones. They stay empty: each test creates its own data with factories
and `RefreshDatabase` rolls it back afterwards.

Tests use MySQL rather than SQLite on purpose, so they behave exactly like the real database
(date columns, for example, are not stored the same way by SQLite).

- `tests/Unit` tests services alone, repositories are mocked (no database, no Laravel)
- `tests/Feature` tests repositories against the real database, and the GraphQL schema

## Changing a GraphQL schema

1. Edit `services/<service>/graphql/schema.graphql`
2. Recompose the supergraph (the services must be running):

   ```bash
   make supergraph
   ```

`router/supergraph.graphql` is committed so the stack starts right after a clone.

## Conventions

- Code, comments and commit messages in English
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`)
- Lighthouse directives first (`@all`, `@hasMany`, `@rename`…), PHP resolvers only when there is logic
- Resolvers grouped by entity: `{Entity}Query`, `{Entity}Mutation`, `{Type}TypeResolver`, one method per field
- Repositories return `Illuminate\Support\Enumerable`, classes are `final` (except Eloquent models)

## Roadmap

- [x] Project setup, Docker, Federation 2
- [x] Service / repository layers in planning and payroll
- [ ] US-01 login: JWT issued by auth-service ✔, verified by every service, login form
- [ ] Recording hours, totals, pay estimate
- [ ] Production Docker images and deployment