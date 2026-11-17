# Hours Tracking Calendar

[![CI](https://github.com/VanciaC/hours-tracking-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/VanciaC/hours-tracking-calendar/actions/workflows/ci.yml)

A calendar to log working hours, follow weekly and monthly totals, and estimate gross pay.

It is a personal project, built to practice a microservice architecture end to end:
Laravel and GraphQL (Lighthouse) services, joined by Apollo Federation 2, behind an Apollo Router,
with a React front end. Everything runs in Docker.

User stories: [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Makefile commands](#makefile-commands)
- [Architecture](#architecture)
- [Development workflow](#development-workflow)
- [Tests](#tests)
- [Code quality and CI](#code-quality-and-ci)
- [Conventions](#conventions)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## Features

**Calendar**

- Month view with the hours worked shown in each day
- A total per week, plus monthly stats: hours worked and estimated gross pay
- The month is kept in the URL, so a page can be bookmarked or shared

**Logging hours**

- Enter a day either as a **duration** (7h00) or as **shifts** (08:00 – 12:00, 13:00 – 16:00)
- Each shift can have an **unpaid break**; paid breaks are simply part of the hours
- Overlapping shifts, an end before the start or a break longer than the shift are rejected
- **Several days at once**: drag across the calendar or Shift + click, then confirm in the selection bar
  (weekends are skipped)
- **Entry templates** ("Standard day", "Half day"…) to fill a day in one click, with a default template

**Pay**

- An **hourly rate history**: a raise starts on a given date, earlier days keep the old rate
- When the rate changes in the middle of a month, the estimate splits the month into periods

**Settings**

- Hourly rates and entry templates: create, edit, delete
- Light, dark or system theme
- Four languages: French, English, Japanese and Arabic (right-to-left layout)

## Tech stack

| Layer             | Tools                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Front end         | React 19, TypeScript, Vite, Apollo Client 4, React Router, GraphQL Code Generator, i18next, Vitest |
| Gateway           | Apollo Router v2 (Federation 2 supergraph)                                                         |
| Services          | PHP 8.4, Laravel 13, Lighthouse 6                                                                  |
| Database          | MySQL 8.4, one database per service                                                                |
| Quality           | ESLint, Prettier, Laravel Pint, Larastan (level 6)                                                 |
| CI                | GitHub Actions                                                                                     |
| Local environment | Docker Compose, WSL 2, Make                                                                        |

## Getting started

### Requirements

- **Docker Desktop** with WSL 2 integration
- **On Windows, clone the project inside WSL** (for example `~/projects`), not on `C:\`.
  Bind mounts from the Windows filesystem are too slow for `composer install` and `npm install`.
- **make** (`sudo apt install make`)
- **openssl**, to create the JWT keys (already installed on most Linux distributions)
- [**Rover**](https://www.apollographql.com/docs/rover/getting-started), only to recompose the supergraph
  after a schema change. Not needed to run the app.

PHP, Composer and Node do **not** need to be installed on your machine: they run in the containers.

### Installation

```bash
git clone https://github.com/VanciaC/hours-tracking-calendar.git
cd hours-tracking-calendar

cp .env.example .env

# JWT signing keys: auth-service signs tokens with the private key,
# every service checks them with the public key. Never committed.
mkdir -p secrets/jwt
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt/private.pem
openssl pkey -in secrets/jwt/private.pem -pubout -out secrets/jwt/public.pem

make up      # builds and starts everything; the first start takes a few minutes
make ps      # wait until the three Laravel services are "healthy"
make seed    # demo data
```

Then open **http://localhost:5173** and sign in with **`test@example.com` / `password`**.

### URLs

| URL                           | What                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| http://localhost:5173         | React front end                                               |
| http://localhost:4000         | Apollo Router, with Apollo Sandbox to explore the whole graph |
| http://localhost:8001/graphql | auth-service alone                                            |
| http://localhost:8002/graphql | planning-service alone                                        |
| http://localhost:8003/graphql | payroll-service alone                                         |
| `localhost:3307`              | MySQL, for a database client                                  |

### Demo data

`make seed` fills the **development** databases (`auth`, `planning`, `payroll`):

- a demo user, `test@example.com` / `password` (id 1)
- a work day for every weekday from the start of last month until today
- two hourly rates: one from the start of the year, a raise from the start of the current month
- two entry templates, "Journée standard" (the default) and "Mi-temps"

Seeders are idempotent: `make seed` can be run again at any time.

### Querying the API from the Sandbox

Get an access token from auth-service:

```bash
curl -s -X POST http://localhost:8001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password"}'
```

Add the header `Authorization: Bearer <accessToken>` in the **Headers** tab, then query across the three services
in one request:

```graphql
query {
    me {
        name
        workDays(from: "2026-11-01", to: "2026-11-30") {
            date
            workedMinutes
        }
        hourlyRates {
            amountCents
            effectiveFrom
        }
    }
}
```

## Makefile commands

Every command runs inside the containers, so it works the same on any machine.

### Stack

| Command     | What it does                                                   |
| ----------- | -------------------------------------------------------------- |
| `make up`   | Builds the images and starts the whole stack in the background |
| `make down` | Stops the stack. Data is kept.                                 |
| `make ps`   | Shows the containers and their health                          |
| `make logs` | Follows the logs of every container (`Ctrl+C` to quit)         |

### Data

| Command      | What it does                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `make seed`  | Fills the development databases with the demo data                                                                     |
| `make fresh` | Drops every table, reruns the migrations and the seeders                                                               |
| `make reset` | Deletes every Docker volume (MySQL included) and restarts from scratch. Run `make seed` once the services are healthy. |

### GraphQL

| Command           | What it does                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `make supergraph` | Recomposes `router/supergraph.graphql` from the running services and restarts the router. Needs Rover. |
| `make codegen`    | Regenerates the front end's TypeScript types from the router's schema. Run it after `make supergraph`. |

### Quality

| Command       | What it does                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `make test`   | Runs the test suite of each Laravel service                                                                                          |
| `make lint`   | **Checks** without changing anything: Pint and Larastan on each service, ESLint and Prettier on the front end. This is what CI runs. |
| `make format` | **Fixes** what can be fixed automatically: Pint, ESLint `--fix` and Prettier                                                         |

`make lint` stops at the first service with a problem. Style issues are fixed by `make format`;
Larastan and ESLint errors about types or hooks have to be fixed by hand.

## Architecture

```
                 Browser
                    │
     frontend (React + Vite + Apollo Client)          :5173
                    │  GraphQL, Authorization: Bearer <JWT>
                    ▼
       router (Apollo Router v2, supergraph)          :4000
          │                  │                  │
          ▼                  ▼                  ▼
    auth-service      planning-service    payroll-service
       :8001              :8002               :8003
   users, login,      work days, shifts,   hourly rates
   JWT issuing        entry templates
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
             mysql 8.4 (one database per service)     :3307
```

### Apollo Federation 2

Each Laravel service is a **subgraph** with its own schema (`services/<service>/graphql/schema.graphql`).
Rover composes them into a single **supergraph** (`router/supergraph.graphql`), which the router serves.
The front end only knows the router: for it, there is one GraphQL API.

The **`User`** entity is the link between the services:

| Service          | Owns                                                 | Adds to `User`                         |
| ---------------- | ---------------------------------------------------- | -------------------------------------- |
| auth-service     | `User` itself (`id`, `name`, `email`), `login`, `me` |                                        |
| planning-service | Work days, shifts, entry templates                   | `workDays(from, to)`, `entryTemplates` |
| payroll-service  | Hourly rates                                         | `hourlyRates`                          |

When the front end asks for `me { workDays { … } }`, the router gets the user from auth-service,
then asks planning-service for the work days of that user, and merges the answers.

### Authentication and ownership

- **auth-service** checks the password and starts a session on `/auth/login`: a **JWT signed with an RSA private key**,
  valid 15 minutes and kept in memory by the front end, plus a **refresh token** in an httpOnly cookie,
  stored hashed and rotated at each use. `/auth/refresh` renews the session, `/auth/logout` revokes it.
- **Every service** verifies the token with the **public key** through a `jwt` guard. No service
  calls auth-service to check a token, and only auth-service can sign one.
- **Ownership is enforced in each service**, not in the router. The `User` entity resolver
  (`app/GraphQL/Entities/User.php`) refuses to resolve another user than the one in the token,
  so every field added to `User` is protected without extra code.
- **Mutations never take a user id.** The user always comes from the token. Updating or deleting a record
  by id looks it up among the user's own records, and answers "not found" for anybody else's.

### Code layers in each service

```
GraphQL resolver   app/GraphQL/Resolvers/{Queries,Mutations,Types}   reads the arguments, calls a service
      │
Service            app/Services                                      business rules
      │  through an interface (app/Repositories/Contracts)
Repository         app/Repositories                                  database access (Eloquent)
```

- **Resolvers** are thin: one class per entity, one method per GraphQL field, named after the field.
- **Services** hold the rules. In planning, `WorkTimeCalculator` holds the work time rules
  (sorted shifts, no overlap, break shorter than the shift) and computes the net minutes.
- **Repositories** are bound to their interface in `app/Providers/RepositoryServiceProvider.php`,
  so services can be unit tested with mocks.
- Multi-step writes (a day and its shifts, several days at once) run in **database transactions**:
  saving ten days either saves all ten or none.
- Net worked minutes are **computed once, when a day is saved**, not on every read.

### Front end

```
frontend/src
├── pages/           one folder per route: CalendarPage, EntryPage, SettingsPage, LoginPage
├── components/      one folder per component, with its CSS next to it
├── graphql/
│   ├── operations/  queries, mutations and fragments (*.graphql)
│   └── __generated__/  types and typed documents from GraphQL Code Generator (committed)
├── lib/             pure logic (dates, pay, hours validation), unit tested in lib/__tests__
├── i18n/            i18next setup, the four locales and the date / money formatters
├── theme/           theme context and provider
└── styles/          design tokens (light and dark) and global styles
```

- **GraphQL Code Generator** reads the operations in `src/graphql/operations` and the router's schema,
  and generates fully typed documents. A query whose field no longer exists fails at compile time.
- The **Apollo cache** is normalized by id. After a write, only the affected data is evicted and refetched.
- **Translations** are typed: a key missing in a locale is a TypeScript error. Dates, money and numbers are
  formatted with `Intl` for the current language.
- The **theme** relies on CSS variables (`styles/tokens.css`). An inline script in `index.html` applies it
  before the first render, so there is no flash of the wrong theme.

### Repository layout

```
.
├── .github/workflows/ci.yml   CI
├── docker/php/                shared PHP image for the three services (development)
├── docker-compose.yml
├── docs/                      user stories
├── frontend/                  React app
├── router/                    router config and the composed supergraph
├── scripts/                   compose-supergraph.sh (used by make supergraph)
├── secrets/                   JWT keys, not committed
├── services/
│   ├── auth-service/
│   ├── planning-service/
│   └── payroll-service/
└── Makefile
```

## Development workflow

### Changing a GraphQL schema

1. Edit `services/<service>/graphql/schema.graphql`.
2. Check it: `docker compose exec <service> php artisan lighthouse:validate-schema`.
3. Recompose the supergraph (the services must be running): `make supergraph`.
4. Regenerate the front end's types: `make codegen`.
5. Commit the schema, `router/supergraph.graphql` and `frontend/src/graphql/__generated__` together.

`router/supergraph.graphql` is committed, so the stack starts right after a clone, without Rover.

### Running artisan or npm in a container

```bash
docker compose exec planning-service php artisan migrate
docker compose exec frontend npm install <package>
```

Files created by a container belong to `root`. See [Troubleshooting](#troubleshooting) if your editor cannot save them.

### Before committing

```bash
make format   # fixes the style
make lint     # checks there is nothing left
make test
```

## Tests

```bash
make test                                                # every Laravel service
docker compose exec planning-service php artisan test    # one service
docker compose exec frontend npm test                    # front end (Vitest)
```

**Services**

- `tests/Unit`: services alone, with mocked repositories (no database).
- `tests/Feature`: repositories against the real database, and the GraphQL API end to end,
  including authentication and ownership (another user's data is never returned).

Tests run on dedicated databases (`auth_testing`, `planning_testing`, `payroll_testing`), never on the
development ones. Each test creates its own data with factories, and `RefreshDatabase` rolls it back.

They use MySQL rather than SQLite on purpose, so they behave exactly like the real database
(SQLite stores dates differently, for example).

**Front end**

- Vitest tests in `src/lib/__tests__` cover the pure logic: calendar ranges, totals, the pay estimate across
  rate changes, hours validation, theme and language detection.

## Code quality and CI

| Tool                                        | Where     | Role                                                 |
| ------------------------------------------- | --------- | ---------------------------------------------------- |
| **Laravel Pint** (Laravel preset)           | services  | Code style, fixed automatically                      |
| **Larastan** level 6                        | services  | Static analysis: types, generics, dead code          |
| **ESLint** (typescript-eslint, React Hooks) | front end | Bugs and bad practices, including the rules of hooks |
| **Prettier**                                | front end | Code style, fixed automatically                      |

The shared VS Code settings (`.vscode/`) format front end files with Prettier and apply ESLint fixes on save.
VS Code recommends the matching extensions when the project is opened.

**GitHub Actions** (`.github/workflows/ci.yml`) runs on every push to `main` and on every pull request:

- **Frontend**: ESLint, Prettier check, Vitest, production build (which also type-checks)
- **auth-service**, **planning-service**, **payroll-service**, in parallel: Pint, Larastan and the test suite,
  each on a fresh MySQL 8.4 with throwaway JWT keys

## Conventions

- Code, comments and commit messages in **English**
- Resolvers grouped by entity: `{Entity}Query`, `{Entity}Mutation`, `{Type}TypeResolver`,
  one method per field, named after the field
- Repositories return `Illuminate\Support\Enumerable` and have an interface in `app/Repositories/Contracts`
- Classes are `final` (except Eloquent models)
- Lighthouse directives first, PHP resolvers only when there is logic
- One `schema.graphql` per service, organized in commented sections
- Front end: no semicolons, single quotes (enforced by Prettier), one folder per component with its CSS

## Troubleshooting

**VS Code cannot save a file ("permission denied")**
The file was created by a container, as `root`. Give it back to your user:

```bash
sudo chown -R "$(id -u):$(id -g)" services frontend
```

**A service stays "unhealthy"**
Look at its logs with `docker compose logs <service>`. On the first start, `composer install` and the migrations
can take a few minutes. Check that the JWT keys exist in `secrets/jwt/`.

**The router does not know a new field**
The supergraph was not recomposed. Run `make supergraph`, then `make codegen`.

**`make: \*** missing separator`**
A command line in the `Makefile` starts with spaces instead of a tab.

## Roadmap

User stories are detailed in [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

**Done**

- [x] Docker environment, Apollo Federation 2, Apollo Router
- [x] Login with JWT: issued by auth-service, verified by every service
- [x] Logging hours: duration or shifts, unpaid breaks, several days at once
- [x] Entry templates
- [x] Calendar with weekly and monthly totals
- [x] Hourly rate history and gross pay estimate
- [x] Light and dark themes, four languages with right-to-left support
- [x] Typed GraphQL operations with Code Generator
- [x] Linters, static analysis and CI

**Next**

- [ ] Handle token expiry in the front end (sign out cleanly, or refresh)
- [ ] Rate limiting on login
- [ ] Tests for auth-service (`AuthService`, `TokenService`, `JwtVerifier`)
- [ ] Account creation and profile
- [ ] Error codes from the services, so the front end can translate them
- [ ] Check the supergraph composition in CI
- [ ] Production Docker images and deployment
- [ ] Overtime, export, long press to select days on mobile
