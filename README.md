# Hours Tracking Calendar

[![CI](https://github.com/VanciaC/hours-tracking-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/VanciaC/hours-tracking-calendar/actions/workflows/ci.yml)

A calendar to log working hours, follow weekly and monthly totals, and estimate gross pay,
for the employees of several client companies.

Each company has its own address (`dupont.your-domain.com`) and only ever sees its own people and hours.
Accounts are created by invitation: an admin of the company invites its employees by email.

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
- [Companies (multi-tenancy)](#companies-multi-tenancy)
- [Development workflow](#development-workflow)
- [Tests](#tests)
- [Code quality and CI](#code-quality-and-ci)
- [Production](#production)
- [Conventions](#conventions)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## Features

**Companies**

- Every client company has its **own subdomain**: `dupont.your-domain.com`, `martin.your-domain.com`…
- A company only sees its own accounts, hours and pay data, in every service
- Companies are created and suspended from the server; a suspended company keeps its data
- The sign-in page shows the company's name; an unknown address or a suspended company gets a clear page

**Accounts**

- **Sign-up by invitation**: an admin invites a person by email, the link (valid 7 days, single use)
  opens the sign-up form with the address already filled in, and the account is verified at once
- Three sign-up modes: `invite` (default), `open` (anyone, used in development) and `closed`
- **Email verification** for open sign-up, with a link that can be resent
- **Forgotten password**: a single-use link valid 1 hour, then every session of the account is signed out
- **Secure session**: short-lived access token, renewed in the background, real sign-out on the server
- Sign-in is blocked for a minute after 5 failed attempts
- Emails in the user's language, under the app's name in that language ("Mes heures" in French)

**Calendar**

- **Month, week and day views**, with the hours worked in each day; the chosen view is kept
  when going to the entry form and back
- In the week view, each day's total (unpaid breaks deducted) stands out
- A total per week, plus stats for the period: hours worked and estimated gross pay
- The period is kept in the URL, so a page can be bookmarked or shared

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

**Administration** (admins of a company, read-only on everyone's data)

- **Team schedule** in day, week and month views: who works when, one color and initials per person,
  a searchable filter to show or hide people, a "now" line on today
- **Users**: search, pagination, verification status; a user's page shows their calendar (day, week or month),
  totals and estimated pay, without any way to change them
- **Invitations**: invite by email, follow pending, accepted and expired invitations, resend or cancel
- Admins keep their own space with the same account, to log their own hours
- The admin role is only given from the server, never from the interface

**Privacy**

- A privacy page explains what is collected, why, who sees it and for how long (GDPR article 13)
- Unverified accounts, expired links and finished invitations are deleted automatically every night

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
| Database          | MySQL 8.4, one database per service, one `tenant_id` per row                                       |
| Emails            | Mailpit in development, a transactional email service in production                                |
| Production        | FrankenPHP (services), Caddy (front end, reverse proxy, on-demand HTTPS), Docker Compose           |
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
- A browser that resolves `*.localhost` on its own: Chrome, Edge and Firefox do, with nothing to configure.

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

make up         # builds and starts everything; the first start takes a few minutes
make ps         # wait until the three Laravel services are "healthy"
make seed       # the "demo" company, its demo accounts and their hours
make demo-team  # optional: six teammates with varied hours, for the team schedule
```

Then open **http://demo.localhost:5173**, the address of the `demo` company, and sign in with:

| Account             | Password   | Role                                     |
| ------------------- | ---------- | ---------------------------------------- |
| `test@example.com`  | `password` | regular user, with hours and pay data    |
| `admin@example.com` | `password` | admin: team schedule, users, invitations |

**http://localhost:5173** belongs to no company: it shows the "unknown address" page, as intended.

### URLs

| URL                            | What                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| http://demo.localhost:5173     | The app, for the `demo` company (also serves `/graphql` and `/auth`) |
| http://`<slug>`.localhost:5173 | The app for any other company created with `make tenant`             |
| http://localhost:8025          | Mailpit: every email sent in development                             |
| http://localhost:4000          | Apollo Router, with Apollo Sandbox to explore the whole graph        |
| http://localhost:8001/graphql  | auth-service alone (`/auth/*` for the session endpoints)             |
| http://localhost:8002/graphql  | planning-service alone                                               |
| http://localhost:8003/graphql  | payroll-service alone                                                |
| `localhost:3307`               | MySQL, for a database client                                         |

### Demo data

`make seed` fills the **development** databases (`auth`, `planning`, `payroll`), all in the `demo` company:

- the `demo` company itself, created first so it gets id 1
- `test@example.com` (id 1) and `admin@example.com`, both with a verified email
- a work day for every weekday of the demo user, from the start of last month until today
- two hourly rates: one from the start of the year, a raise from the start of the current month
- two entry templates, "Journée standard" (the default) and "Mi-temps"

`make demo-team` adds six teammates to `demo` and fills a few weeks of varied hours for every verified account
of the company, so the team schedule has something to show.

Seeders are idempotent: `make seed` can be run again at any time. `make fresh` starts the three databases over.

### Emails in development

No email ever leaves your machine in development. auth-service sends them to **Mailpit**,
which catches them and shows them at **http://localhost:8025**.

Links in the emails open the company's own address, for example `http://demo.localhost:5173/...`.

To try an invitation:

1. Sign in as `admin@example.com` on http://demo.localhost:5173, open **Invitations** and invite an address
2. Open http://localhost:8025 and click the button in the invitation email, in a private window
3. The sign-up form opens with the address filled in; the account works at once

To try a new company and its first admin:

```bash
make tenant t=dupont n="Boulangerie Dupont" e=patron@dupont.fr
```

The invitation lands in Mailpit, its link opens http://dupont.localhost:5173, and the account created from it
is the company's admin. Dupont's team schedule is empty: it sees nothing of `demo`.

Development runs in the `open` sign-up mode (`REGISTRATION_MODE` in `docker-compose.yml`), so the sign-up page
also works without an invitation. Production defaults to `invite`.

### Querying the API from the Sandbox

Every request must say which company it is for, with the `X-Forwarded-Host` header
(the browser's address, which Vite or Caddy normally set). Get an access token for the demo user:

```bash
curl -s -X POST http://localhost:8001/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Forwarded-Host: demo.localhost' \
  -d '{"email":"test@example.com","password":"password"}'
```

Open http://localhost:4000 and add two headers in the **Headers** tab:

- `Authorization: Bearer <accessToken>`
- `X-Forwarded-Host: demo.localhost`

Then query across the three services in one request. The token is valid for 15 minutes,
and only on its own company's address.

```graphql
query {
    me {
        name
        workDays(from: "2026-11-01", to: "2026-11-30") {
            date
            durationMinutes
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
`t=` is always the subdomain of a company (`demo`, `dupont`…).

### Stack

| Command     | What it does                                                   |
| ----------- | -------------------------------------------------------------- |
| `make up`   | Builds the images and starts the whole stack in the background |
| `make down` | Stops the stack. Data is kept.                                 |
| `make ps`   | Shows the containers and their health                          |
| `make logs` | Follows the logs of every container (`Ctrl+C` to quit)         |

### Data

| Command          | What it does                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `make seed`      | Fills the development databases with the `demo` company and its demo data                                              |
| `make demo-team` | Adds six teammates to `demo` and fills their hours, for the team schedule (development only)                           |
| `make fresh`     | Drops every table, reruns the migrations and the seeders                                                               |
| `make reset`     | Deletes every Docker volume (MySQL included) and restarts from scratch. Run `make seed` once the services are healthy. |

### Companies

| Command                                                 | What it does                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `make tenant t=dupont n="Boulangerie Dupont" e=<email>` | Creates a company and emails an invitation to its first admin (`e=` optional) |
| `make suspend t=dupont`                                 | Cuts the company off at once, without deleting anything                       |
| `make resume t=dupont`                                  | Gives a suspended company its access back                                     |

### Accounts

| Command                                  | What it does                                                   |
| ---------------------------------------- | -------------------------------------------------------------- |
| `make admin t=demo e=<email> n="<name>"` | Creates a verified admin account in a company (password asked) |
| `make promote t=demo e=<email>`          | Gives the admin role to an existing account of a company       |
| `make demote t=demo e=<email>`           | Removes the admin role                                         |

The same address may have a separate account in several companies, so every account command needs `t=`.
A role change reaches the other services when the access token is renewed, within 15 minutes.

### GraphQL

| Command           | What it does                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `make supergraph` | Recomposes `router/supergraph.graphql` from the running services and recreates the router. Needs Rover. |
| `make codegen`    | Regenerates the front end's TypeScript types from the router's schema. Run it after `make supergraph`.  |

### Artisan

| Command                                  | What it does                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
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
                    Browser, on dupont.your-domain.com
                            │  same origin: /, /graphql, /auth
                            ▼
   Vite dev server (development) or Caddy (production)
   adds X-Forwarded-Host: the address typed in the browser
          │                                   │
          │ /graphql                          │ /auth/*  (sign-in, refresh, sign-out, company)
          │ Authorization: Bearer <JWT>       │ refresh token in an httpOnly cookie
          ▼                                   │
   router (Apollo Router v2, supergraph) :4000│
   passes on Authorization and X-Forwarded-Host
          │                  │                │
          ▼                  ▼                ▼
   planning-service   payroll-service    auth-service
        :8002              :8003            :8001
   work days, shifts,  hourly rates      companies, users, invitations,
   entry templates                       sign-up, sessions, JWT
          │                  │                │
          └──────────────────┼────────────────┘
                             ▼
             mysql 8.4 (one database per service)     :3307
```

The router also reaches auth-service for the `User` entity and the account mutations.

### Apollo Federation 2

Each Laravel service is a **subgraph** with its own schema (`services/<service>/graphql/schema.graphql`).
Rover composes them into a single **supergraph** (`router/supergraph.graphql`), which the router serves.
The front end only knows the router: for it, there is one GraphQL API.

The **`User`** entity is the link between the services:

| Service          | Owns                                                                                           | Adds to `User`                         |
| ---------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------- |
| auth-service     | `User` itself (`id`, `name`, `email`, `role`), `me`, sign-up, invitations, the admin user list |                                        |
| planning-service | Work days, shifts, entry templates, the team schedule (`teamWorkDays`)                         | `workDays(from, to)`, `entryTemplates` |
| payroll-service  | Hourly rates                                                                                   | `hourlyRates`                          |

When the front end asks for `me { workDays { … } }`, the router gets the user from auth-service,
then asks planning-service for the work days of that user, and merges the answers.
An admin's `adminUser(id) { workDays hourlyRates }` works the same way, across the three services.

### Same origin, in development as in production

The front end calls `/graphql` and `/auth` on its own address. **Vite** forwards them in development
(`frontend/vite.config.ts`), **Caddy** in production (`docker/web/Caddyfile`). There is no CORS to configure,
and the refresh cookie works the same way everywhere.

### Authentication and sessions

- **Sign-up** (`register`, GraphQL) depends on the sign-up mode (`REGISTRATION_MODE`):
    - `invite` (default): only with a valid invitation. The invited address is kept, whatever is typed,
      and the account is verified at once, since opening the emailed link proves the address.
    - `open`: anyone; the account stays unverified until the link of the verification email is clicked
      (valid 24 hours).
    - `closed`: nobody, not even with an invitation.
- **Invitations** are sent by an admin, valid 7 days and single use. Only the first admin of a company,
  invited by `tenant:create` on the server, gets the admin role from an invitation.
- **Session endpoints** live under `/auth`, outside GraphQL, because they set a cookie that the router
  would not pass on to the browser:

    | Endpoint                  | What it does                                                         |
    | ------------------------- | -------------------------------------------------------------------- |
    | `GET /auth/tenant`        | Gives the company of the current address (slug and name)             |
    | `POST /auth/login`        | Checks the password among the company's accounts, starts a session   |
    | `POST /auth/verify-email` | Verifies the address from the email link, starts a session           |
    | `POST /auth/refresh`      | Exchanges the refresh cookie for a new access token and a new cookie |
    | `POST /auth/logout`       | Revokes the session on the server and removes the cookie             |

- A session is a **JWT access token signed with an RSA private key**, valid 15 minutes and kept in memory
  by the front end, plus a **refresh token** valid 30 days in an httpOnly, SameSite=Strict cookie limited to `/auth`.
- The access token carries the user's id, role and **company** (`tid` and `tenant`, its subdomain).
- The refresh token is **stored hashed and rotated at each use**. Replaying an old one revokes the whole session;
  a 10-second grace covers two tabs refreshing at the same time.
- Every token sent by email or cookie (verification, password reset, invitation, refresh) is random,
  single use, time-limited and **stored only as a SHA-256 hash**.
- `/auth` only accepts JSON posts, which, with the SameSite cookie, closes the door to cross-site request forgery.
- **Every service** verifies the access token with the **public key** through a `jwt` guard. No service
  calls auth-service to check a token, and only auth-service can sign one.
- **Ownership is enforced in each service**, not in the router. The `User` entity resolver
  (`app/GraphQL/Entities/User.php`) only resolves the user of the token, or anyone of the company for an admin,
  so every field added to `User` is protected without extra code.
- **Mutations never take a user id.** The user always comes from the token. Updating or deleting a record
  by id looks it up among the user's own records, and answers "not found" for anybody else's.
- Errors carry a **stable code** (`EMAIL_NOT_VERIFIED`, `INVALID_INVITATION`, `TENANT_NOT_FOUND`…),
  in `extensions.code` for GraphQL and in the JSON body for `/auth`, so the front end shows a translated message.

Details, diagrams and design choices: [`docs/authentication.md`](docs/authentication.md).

### Scheduled tasks

auth-service deletes stale data every night at 3:30 with Laravel's `model:prune`:

| Data                                        | Deleted                                  |
| ------------------------------------------- | ---------------------------------------- |
| Accounts whose email was never verified     | after 7 days, with their links           |
| Email verification and password reset links | once expired or used                     |
| Refresh tokens                              | once expired                             |
| Invitations                                 | once accepted, or 30 days after expiring |

In production, a dedicated container (`auth-scheduler`) runs `php artisan schedule:work`. In development
it is optional: `docker compose --profile scheduler up -d auth-scheduler`, or run `model:prune` by hand.

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
- Multi-step writes (a day and its shifts, several days at once, an account and its invitation) run in
  **database transactions**: saving ten days either saves all ten or none.
- Net worked minutes are **computed once, when a day is saved**, not on every read.
- **Settings are read when used**, not in constructors: Lighthouse keeps resolver instances between requests.

### Front end

```
frontend/src
├── auth/            /auth calls, the in-memory session and its renewal
├── tenant/          the company of the current address, and its React context
├── pages/           one folder per route: calendar, entry, settings, sign-in, sign-up, admin pages…
├── components/      one folder per component, with its CSS next to it
├── graphql/
│   ├── operations/  queries, mutations and fragments (*.graphql)
│   └── __generated__/  types and typed documents from GraphQL Code Generator (committed)
├── lib/             pure logic (dates, pay, hours validation, team schedule, GraphQL errors), unit tested in lib/__tests__
├── i18n/            i18next setup, the four locales and the date / money formatters
├── theme/           theme context and provider
└── styles/          design tokens (light and dark) and global styles
```

- At startup, the front end asks `/auth/tenant` which company the address belongs to, before anything else.
  An unknown address or a suspended company gets its own page instead of the app.
- **GraphQL Code Generator** reads the operations in `src/graphql/operations` and the router's schema,
  and generates fully typed documents. A query whose field no longer exists fails at compile time.
- The **access token** never touches localStorage. It is renewed shortly before it expires,
  one renewal at a time, and restored from the refresh cookie when the page loads.
- The **Apollo cache** is normalized by id. After a write, only the affected data is evicted and refetched.
- **Translations** are typed: a key missing in a locale is a TypeScript error. Dates, money and numbers are
  formatted with `Intl` for the current language.
- The **theme** relies on CSS variables (`styles/tokens.css`). An inline script in `index.html` applies it
  before the first render, so there is no flash of the wrong theme.
- Admin screens are hidden from regular users, but this is only comfort: the API refuses every admin query
  without the role.

### Repository layout

```
.
├── .github/workflows/ci.yml   CI
├── docker/
│   ├── mysql/init/            creates the databases and the app user
│   ├── php/                   development image for the three services
│   ├── php-prod/              production image for the three services (FrankenPHP)
│   └── web/                   production image of the front end, and the Caddyfile
├── docker-compose.yml         development stack
├── docker-compose.prod.yml    production stack
├── docs/                      user stories, authentication design
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

## Companies (multi-tenancy)

The app serves several client companies from **one deployment and one database per service**.
Every row that belongs to a company carries its `tenant_id`, and every query is limited to it automatically.

### How a request finds its company

1. The browser opens `dupont.your-domain.com`. Vite (development) or Caddy (production) forwards
   `/auth` and `/graphql` with the header **`X-Forwarded-Host: dupont.your-domain.com`**;
   the router passes it on to the three services.
2. **auth-service** reads the subdomain in a global middleware (`ResolveTenant`), finds the company
   and selects it for the request (`CurrentTenant`). An unknown company gets `404 TENANT_NOT_FOUND`,
   a suspended one `403 TENANT_SUSPENDED`.
3. At sign-in, the account is looked up **among the company's accounts only**, and the access token
   records the company: `tid` (its id) and `tenant` (its subdomain).
4. **planning-service and payroll-service** have no companies table: they take the company from the token
   (`SetTenantFromToken`). A token is only accepted on **its own company's address**: copied to another
   subdomain, it finds nobody.

The subdomain only chooses where to look. Security rests on the signed token and on the filter below,
never on the address alone.

### How queries stay inside a company

- The models that belong to a company (`User`, `Invitation`, `WorkDay`, `EntryTemplate`, `HourlyRate`)
  use the **`BelongsToTenant`** trait:
    - a **global scope** adds `where tenant_id = <current company>` to every query, so a repository
      cannot forget it;
    - new rows are **created in the current company**, and creating one with no company selected fails loudly.
- Tokens sent by email (verification, reset, invitation) and refresh tokens belong to a user, so they are
  limited through their user: a link of one company opened on another company's address finds nobody.
- Shifts belong to a work day, which already carries the company.
- Server commands that work across companies (the nightly `model:prune`) run with no company selected,
  and see every row.

### Emails and addresses

- `FRONTEND_URL` is a template: `https://{tenant}.your-domain.com`. Every emailed link opens the company's own address.
- An email address is **unique within a company**, not globally: the same person can have a separate account
  in two companies.
- Subdomains follow DNS rules (lowercase letters, digits, inner dashes, 63 characters at most).
  `www`, `api`, `app`, `admin`, `mail`, `auth`, `static` and `status` are reserved.

### Why a shared database

One database with a `tenant_id` column is the usual model for a B2B SaaS of this size: one migration,
one backup, one deployment for every company. The isolation is enforced in code, and covered by
**isolation tests in each service** (an admin of one company never sees the team schedule, the users,
the hours or the pay of another one).

A database per company would give a physical isolation and per-client backups and deletions, at the cost of
N × 3 databases to migrate and back up. It is on the [roadmap](#roadmap), after the tenancy code is shared.

## Development workflow

### Changing a GraphQL schema

1. Edit `services/<service>/graphql/schema.graphql`.
2. Check it: `docker compose exec <service> php artisan lighthouse:validate-schema`.
3. Recompose the supergraph (the services must be running): `make supergraph`.
4. Regenerate the front end's types: `make codegen`.
5. Commit the schema, `router/supergraph.graphql` and `frontend/src/graphql/__generated__` together.

`router/supergraph.graphql` is committed, so the stack starts right after a clone, without Rover.
CI fails if it is out of date.

### Adding a table that belongs to a company

1. Add a `tenant_id` column (unsigned big integer, not null, indexed; a foreign key to `tenants` in auth-service only).
2. Add the `BelongsToTenant` trait and `@property int $tenant_id` to the model.
3. Add an isolation test: rows created in one company are invisible from another.

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
docker compose exec -T frontend npx tsc --noEmit   # type-checks the front end, as the CI build does
```

## Tests

```bash
make test                                                # every Laravel service
docker compose exec planning-service php artisan test    # one service
docker compose exec frontend npm test                    # front end (Vitest)
```

**Services**

- `tests/Unit`: services alone, with mocked repositories (no database), and the JWT verification
  (including the company claims and the address check).
- `tests/Feature`: repositories against the real database, the GraphQL API end to end
  (including authentication, ownership and admin access), the `/auth` endpoints (sign-in, rate limiting,
  refresh token rotation and replay, sign-out, email verification), invitations, password reset,
  the server commands and the nightly prune.
- **Tenancy tests** in each service: an unknown or suspended company is refused, an account only signs in on
  its own company, a token is useless on another company's address, emailed links only work in their company,
  and an admin never sees another company's data.

Every test runs inside a company: the base `TestCase` creates one (`acme` in auth-service) and sends requests
from its subdomain. `actAsTenant()` switches to another company within a test.

Tests run on dedicated databases (`auth_testing`, `planning_testing`, `payroll_testing`), never on the
development ones. Each test creates its own data with factories, and `RefreshDatabase` rolls it back.
Emails are faked: tests check what would have been sent, and read the link from it, as the user would.

They use MySQL rather than SQLite on purpose, so they behave exactly like the real database
(SQLite stores dates differently, for example).

**Front end**

- Vitest tests in `src/lib/__tests__` cover the pure logic: calendar ranges, totals, the pay estimate across
  rate changes, hours validation, the team schedule layout, theme and language detection, GraphQL error codes.
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

## Production

`docker-compose.prod.yml` runs the same services from production images:

- **Services**: FrankenPHP, code copied into the image, no dev dependencies; caches and migrations at startup
  (`docker/php-prod/Dockerfile`).
- **Scheduler**: `auth-scheduler`, the auth-service image running `schedule:work` for the nightly prune.
- **Front end**: the Vite build served by **Caddy**, which also forwards `/graphql` and `/auth`
  and adds `X-Forwarded-Host` (`docker/web/`).
- **Only Caddy is exposed**; MySQL, the router and the services stay on Docker's internal network.
- The router runs without introspection, Sandbox or error details, and passes on the token and the
  browser's address (`router/router.prod.yaml`).
- Secrets come from `.env.prod`, never committed (see `.env.prod.example`).

### HTTPS for every company

Caddy gets the certificate of a subdomain **on its first visit** (on-demand TLS). Before asking
Let's Encrypt, it asks auth-service whether the address belongs to a company
(`GET /internal/tls-allowed?domain=…`, reachable only from inside the Docker network):
only the bare domain and existing companies get a certificate, so nobody can make the server request
certificates for made-up names. Certificates are kept in the `caddy-data` volume across restarts.

### DNS

Two records, both to the server's IP (plus the same two in AAAA for IPv6):

| Type | Name      | Target      |
| ---- | --------- | ----------- |
| A    | _(empty)_ | server's IP |
| A    | `*`       | server's IP |

The wildcard sends every company subdomain to the server, with nothing to add for a new company.

### Starting

```bash
cp .env.prod.example .env.prod   # then fill it in
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml exec auth-service php artisan tenant:create <slug> "<name>" --admin=<email>
```

## Conventions

- Code, comments and commit messages in **English**
- Resolvers grouped by entity: `{Entity}Query`, `{Entity}Mutation`, `{Type}TypeResolver`,
  one method per field, named after the field
- Repositories return `Illuminate\Support\Enumerable` and have an interface in `app/Repositories/Contracts`
- Classes are `final` (except Eloquent models)
- Lighthouse directives first, PHP resolvers only when there is logic
- One `schema.graphql` per service, organized in commented sections
- Tokens sent by email or cookie are random and stored only as a SHA-256 hash
- Every table that belongs to a company has a `tenant_id` and a model with `BelongsToTenant`
- Front end: no semicolons, single quotes (enforced by Prettier), one folder per component with its CSS

## Troubleshooting

**http://localhost:5173 shows "unknown address"**
That address belongs to no company. Open **http://demo.localhost:5173** (after `make seed`), or the subdomain
of a company created with `make tenant`.

**A request answers `TENANT_NOT_FOUND`**
The company was not found from the address. From the browser, check the subdomain and that the company exists.
From curl or the Sandbox, add the header `X-Forwarded-Host: demo.localhost`.

**Signed in, but `me` is `null` in the Sandbox**
The token belongs to another company than the `X-Forwarded-Host` header, or it expired (15 minutes).

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
The development database may have been recreated. Run `make fresh` to rebuild the three databases with the demo data,
and sign in on http://demo.localhost:5173.

**The router does not know a new field**
The supergraph was not recomposed. Run `make supergraph`, then `make codegen`.

**The router or the front end does not restart ("no such file or directory")**
A single-file mount still points to a file that was replaced (by Rover or by git). Recreate the container
instead of restarting it: `docker compose up -d --force-recreate router`. `make supergraph` does it for the router.

**A test fails with "may not be called on model … while it is being booted"**
Look at the first error of the run: a class used while the model boots (a scope, a trait) could not be loaded,
often because its file is not in the folder matching its namespace.

**`make: \*** missing separator`**
A command line in the `Makefile` starts with spaces instead of a tab.

## Roadmap

User stories are detailed in [`docs/user-stories-hours-tracking-calendar.docx`](docs/user-stories-hours-tracking-calendar.docx).

**Done**

- [x] Docker environment, Apollo Federation 2, Apollo Router
- [x] Logging hours: duration or shifts, unpaid breaks, several days at once
- [x] Entry templates
- [x] Calendar in month, week and day views, with totals
- [x] Hourly rate history and gross pay estimate
- [x] Light and dark themes, four languages with right-to-left support
- [x] Typed GraphQL operations with Code Generator
- [x] Linters, static analysis and CI, including the supergraph composition check
- [x] Sign-up with email verification, password reset by email
- [x] Secure session: short access tokens, rotating refresh tokens, real sign-out, sign-in rate limiting
- [x] Error codes from the services, translated by the front end
- [x] Administration area: team schedule (day, week, month), users list, read-only user pages
- [x] Sign-up by invitation, with three sign-up modes
- [x] Privacy page, automatic deletion of stale data
- [x] Several client companies, each on its own subdomain, isolated in every service
- [x] Production Docker images and compose stack, HTTPS for every subdomain

**Next (1.x)**

- [ ] Deployment on a VPS, with automatic deployment from CI
- [ ] Daily database backups, kept outside the server, with a restore test
- [ ] CSV export of the hours (US-29), overtime, long press to select days on mobile
- [ ] Deletion of accounts inactive for 3 years, after a warning email
- [ ] Night shifts (a shift ending the next day)

**2.0**

- [ ] Extract the tenancy and token code, copied today in planning and payroll, into a shared Composer package

**Later**

- [ ] A database per company, as an option for clients that need a physical isolation
