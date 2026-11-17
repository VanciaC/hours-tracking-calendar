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

**Account**

- **Sign-up** with name, email and password (8 characters minimum)
- **Email verification**: the account works once the link received by email is clicked
- The verification email is sent in the user's language, and can be resent
- **Secure session**: short-lived access token, renewed in the background, real sign-out on the server
- Sign-in is blocked for a minute after 5 failed attempts

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
| Emails            | Mailpit in development, a transactional email service in production                                |
| Production        | FrankenPHP (services), Caddy (front end, reverse proxy, HTTPS), Docker Compose                     |
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

| URL                           | What                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| http://localhost:5173         | React front end (also serves `/graphql` and `/auth`, see below)       |
| http://localhost:8025         | Mailpit: every email sent in development (sign-up verification…)     |
| http://localhost:4000         | Apollo Router, with Apollo Sandbox to explore the whole graph         |
| http://localhost:8001/graphql | auth-service alone (`/auth/*` for the session endpoints)              |
| http://localhost:8002/graphql | planning-service alone                                                |
| http://localhost:8003/graphql | payroll-service alone                                                 |
| `localhost:3307`              | MySQL, for a database client                                          |

### Demo data

`make seed` fills the **development** databases (`auth`, `planning`, `payroll`):

- a demo user, `test@example.com` / `password` (id 1), with a verified email
- a work day for every weekday from the start of last month until today
- two hourly rates: one from the start of the year, a raise from the start of the current month
- two entry templates, "Journée standard" (the default) and "Mi-temps"

Seeders are idempotent: `make seed` can be run again at any time.

### Emails in development

No email ever leaves your machine in development. auth-service sends them to **Mailpit**,
which catches them and shows them at **http://localhost:8025**.

To try the sign-up flow:

1. Create an account on http://localhost:5173/inscription
2. Open http://localhost:8025 and click the button in the verification email
3. You land on the calendar, signed in

In production, emails go through a transactional email service (Brevo or Resend), set with the `MAIL_*` variables.

### Querying the API from the Sandbox

Get an access token from auth-service:

```bash
curl -s -X POST http://localhost:8001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password"}'
```

Open http://localhost:4000, add the header `Authorization: Bearer <accessToken>` in the **Headers** tab,
then query across the three services in one request. The token is valid for 15 minutes.

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

| Command           | What it does                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `make supergraph` | Recomposes `router/supergraph.graphql` from the running services and recreates the router. Needs Rover. |
| `make codegen`    | Regenerates the front end's TypeScript types from the router's schema. Run it after `make supergraph`.   |

### Artisan

| Command                                 | What it does                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| `make artisan s=<service> c="<command>"` | Runs an artisan command as your user, so generated files belong to you, not to root |

For example: `make artisan s=auth-service c="make:migration create_example_table"`.

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
                            │  same origin: /, /graphql, /auth
                            ▼
   Vite dev server (development) or Caddy (production)       :5173
          │                                   │
          │ /graphql                          │ /auth/*  (sign-in, refresh, sign-out)
          │ Authorization: Bearer <JWT>       │ refresh token in an httpOnly cookie
          ▼                                   │
   router (Apollo Router v2, supergraph) :4000│
          │                  │                │
          ▼                  ▼                ▼
   planning-service   payroll-service    auth-service
        :8002              :8003            :8001
   work days, shifts,  hourly rates      users, sign-up,
   entry templates                       sessions, JWT
          │                  │                │
          └──────────────────┼────────────────┘
                             ▼
             mysql 8.4 (one database per service)     :3307
```

The router also reaches auth-service for the `User` entity and the `register` mutation.

### Apollo Federation 2

Each Laravel service is a **subgraph** with its own schema (`services/<service>/graphql/schema.graphql`).
Rover composes them into a single **supergraph** (`router/supergraph.graphql`), which the router serves.
The front end only knows the router: for it, there is one GraphQL API.

The **`User`** entity is the link between the services:

| Service          | Owns                                                                        | Adds to `User`                         |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| auth-service     | `User` itself (`id`, `name`, `email`), `me`, `register`, `resendVerificationEmail` |                                        |
| planning-service | Work days, shifts, entry templates                                          | `workDays(from, to)`, `entryTemplates` |
| payroll-service  | Hourly rates                                                                | `hourlyRates`                          |

When the front end asks for `me { workDays { … } }`, the router gets the user from auth-service,
then asks planning-service for the work days of that user, and merges the answers.

### Same origin, in development as in production

The front end calls `/graphql` and `/auth` on its own address. **Vite** forwards them in development
(`frontend/vite.config.ts`), **Caddy** in production (`docker/web/Caddyfile`). There is no CORS to configure,
and the refresh cookie works the same way everywhere.

### Authentication and sessions

- **Sign-up** (`register`, GraphQL) creates an unverified account and sends a verification email.
  The link holds a random single-use token, valid 24 hours; only its SHA-256 is stored.
- **Session endpoints** live under `/auth`, outside GraphQL, because they set a cookie that the router
  would not pass on to the browser:

  | Endpoint                  | What it does                                                         |
  | ------------------------- | -------------------------------------------------------------------- |
  | `POST /auth/login`        | Checks the password, starts a session                                |
  | `POST /auth/verify-email` | Verifies the address from the email link, starts a session           |
  | `POST /auth/refresh`      | Exchanges the refresh cookie for a new access token and a new cookie |
  | `POST /auth/logout`       | Revokes the session on the server and removes the cookie             |

- A session is a **JWT access token signed with an RSA private key**, valid 15 minutes and kept in memory
  by the front end, plus a **refresh token** valid 30 days in an httpOnly, SameSite=Strict cookie limited to `/auth`.
- The refresh token is **stored hashed and rotated at each use**. Replaying an old one revokes the whole session;
  a 10-second grace covers two tabs refreshing at the same time.
- `/auth` only accepts JSON requests, which, with the SameSite cookie, closes the door to cross-site request forgery.
- **Every service** verifies the access token with the **public key** through a `jwt` guard. No service
  calls auth-service to check a token, and only auth-service can sign one.
- **Ownership is enforced in each service**, not in the router. The `User` entity resolver
  (`app/GraphQL/Entities/User.php`) refuses to resolve another user than the one in the token,
  so every field added to `User` is protected without extra code.
- **Mutations never take a user id.** The user always comes from the token. Updating or deleting a record
  by id looks it up among the user's own records, and answers "not found" for anybody else's.
- Errors carry a **stable code** (`EMAIL_NOT_VERIFIED`, `TOO_MANY_ATTEMPTS`…), in `extensions.code` for GraphQL
  and in the JSON body for `/auth`, so the front end shows a translated message.

### Code layers in each service

```
GraphQL resolver   app/GraphQL/Resolvers/{Queries,Mutations,Types}   reads the arguments, calls a service
or HTTP controller app/Http/Controllers (auth-service, /auth only)
      │
Service            app/Services                                      business rules
      │  through an interface (app/Repositories/Contracts)
Repository         app/Repositories                                  database access (Eloquent)
```

- **Resolvers and controllers** are thin: one class per entity, one method per GraphQL field or endpoint.
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
├── auth/            /auth calls, the in-memory session and its renewal
├── pages/           one folder per route: Calendar, Entry, Settings, Login, Register, VerifyEmail
├── components/      one folder per component, with its CSS next to it
├── graphql/
│   ├── operations/  queries, mutations and fragments (*.graphql)
│   └── __generated__/  types and typed documents from GraphQL Code Generator (committed)
├── lib/             pure logic (dates, pay, hours validation, GraphQL errors), unit tested in lib/__tests__
├── i18n/            i18next setup, the four locales and the date / money formatters
├── theme/           theme context and provider
└── styles/          design tokens (light and dark) and global styles
```

- **GraphQL Code Generator** reads the operations in `src/graphql/operations` and the router's schema,
  and generates fully typed documents. A query whose field no longer exists fails at compile time.
- The **access token** never touches localStorage. It is renewed shortly before it expires,
  one renewal at a time, and restored from the refresh cookie when the page loads.
- The **Apollo cache** is normalized by id. After a write, only the affected data is evicted and refetched.
- **Translations** are typed: a key missing in a locale is a TypeScript error. Dates, money and numbers are
  formatted with `Intl` for the current language.
- The **theme** relies on CSS variables (`styles/tokens.css`). An inline script in `index.html` applies it
  before the first render, so there is no flash of the wrong theme.

### Production

`docker-compose.prod.yml` runs the same services from production images:

- **Services**: FrankenPHP, code copied into the image, no dev dependencies; caches and migrations at startup
  (`docker/php-prod/Dockerfile`).
- **Front end**: the Vite build served by **Caddy**, which also forwards `/graphql` and `/auth`
  and gets the HTTPS certificate on its own (`docker/web/`).
- **Only Caddy is exposed**; MySQL, the router and the services stay on Docker's internal network.
- The router runs without introspection or Sandbox (`router/router.prod.yaml`).
- Secrets come from `.env.prod`, never committed (see `.env.prod.example`).

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Repository layout

```
.
├── .github/workflows/ci.yml   CI
├── docker/
│   ├── mysql/init/            creates the databases and the app user
│   ├── php/                   development image for the three services
│   ├── php-prod/              production image for the three services (FrankenPHP)
│   └── web/                   production image of the front end (Caddy)
├── docker-compose.yml         development stack
├── docker-compose.prod.yml    production stack
├── docs/                      user stories
├── frontend/                  React app
├── router/                    router config (dev and prod) and the composed supergraph
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
CI fails if it is out of date.

### Running artisan or npm in a container

```bash
make artisan s=planning-service c=migrate
docker compose exec frontend npm install <package>
```

`make artisan` runs as your user. Files created by a plain `docker compose exec` belong to `root`:
see [Troubleshooting](#troubleshooting) if your editor cannot save them.

### Branches and pull requests

`main` is protected: every change goes through a branch and a pull request, merged once the CI is green.

```bash
git switch main && git pull
git switch -c feat/<description>
```

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
- `tests/Feature`: repositories against the real database, the GraphQL API end to end
  (including authentication and ownership), and the `/auth` endpoints: sign-in, rate limiting,
  refresh token rotation and replay, sign-out, email verification.

Tests run on dedicated databases (`auth_testing`, `planning_testing`, `payroll_testing`), never on the
development ones. Each test creates its own data with factories, and `RefreshDatabase` rolls it back.
Emails are faked: tests check what would have been sent, and read the verification link from it.

They use MySQL rather than SQLite on purpose, so they behave exactly like the real database
(SQLite stores dates differently, for example).

**Front end**

- Vitest tests in `src/lib/__tests__` cover the pure logic: calendar ranges, totals, the pay estimate across
  rate changes, hours validation, theme and language detection, GraphQL error codes.
- `src/auth/__tests__` covers the session: token renewal, one renewal for concurrent requests, expiry.

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
- **Supergraph**: starts the three services, composes them with Rover, and fails if they do not compose
  or if `router/supergraph.graphql` is out of date

## Conventions

- Code, comments and commit messages in **English**
- Resolvers grouped by entity: `{Entity}Query`, `{Entity}Mutation`, `{Type}TypeResolver`,
  one method per field, named after the field
- Repositories return `Illuminate\Support\Enumerable` and have an interface in `app/Repositories/Contracts`
- Classes are `final` (except Eloquent models)
- Lighthouse directives first, PHP resolvers only when there is logic
- One `schema.graphql` per service, organized in commented sections
- Tokens sent by email or cookie are random and stored only as a SHA-256 hash
- Front end: no semicolons, single quotes (enforced by Prettier), one folder per component with its CSS

## Troubleshooting

**VS Code cannot save a file ("permission denied")**
The file was created by a container, as `root`. Give it back to your user:

```bash
sudo chown -R "$(id -u):$(id -g)" services frontend
```

**`make artisan` fails with "laravel.log could not be opened"**
The log file was created by the container, as `root`. Give the writable folders back to your user:

```bash
sudo chown -R "$(id -u):$(id -g)" services/*/storage services/*/bootstrap/cache
```

**A service stays "unhealthy"**
Look at its logs with `docker compose logs <service>`. On the first start, `composer install` and the migrations
can take a few minutes. Check that the JWT keys exist in `secrets/jwt/`.

**Sign-in refuses the demo user**
The development database may have been recreated. Run `make fresh` to rebuild the three databases with the demo data.

**The router does not know a new field**
The supergraph was not recomposed. Run `make supergraph`, then `make codegen`.

**The router does not restart after `make supergraph`**
Rover replaces the supergraph file, and a single-file mount still points to the old one.
`make supergraph` recreates the router for this reason; by hand: `docker compose up -d --force-recreate router`.

**`make: *** missing separator`**
A command line in the `Makefile` starts with spaces instead of a tab.

## Roadmap

User stories are detailed in [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

**Done**

- [x] Docker environment, Apollo Federation 2, Apollo Router
- [x] Logging hours: duration or shifts, unpaid breaks, several days at once
- [x] Entry templates
- [x] Calendar with weekly and monthly totals
- [x] Hourly rate history and gross pay estimate
- [x] Light and dark themes, four languages with right-to-left support
- [x] Typed GraphQL operations with Code Generator
- [x] Linters, static analysis and CI, including the supergraph composition check
- [x] Sign-up with email verification
- [x] Secure session: short access tokens, rotating refresh tokens, real sign-out, sign-in rate limiting
- [x] Error codes from the services, translated by the front end
- [x] Production Docker images and compose stack

**Next**

- [ ] Administration area: users list, their hours, exports
- [ ] Week view of the calendar
- [ ] Deployment on a VPS, with automatic deployment from CI
- [ ] Daily database backups, kept outside the server
- [ ] Password reset by email
- [ ] Overtime, export, long press to select days on mobile
- [ ] Night shifts (a shift ending the next day)