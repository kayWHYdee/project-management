# uniquepm

Internal project-management tool for a water-treatment business: for each project,
track its status, what has been sent to it, and what has been spent. Runs entirely on
one always-on machine on the office LAN under Docker Compose.

> **Scope:** project management only — not inventory. A separate inventory app may
> later share this Postgres instance via an `inventory` schema. This app owns only the
> `pm` schema and the two must never share tables.

## Stack

| Layer    | Choice                                                      |
| -------- | ----------------------------------------------------------- |
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) |
| Frontend | React 19 + TypeScript (strict) + Vite, installable PWA      |
| UI       | Tailwind CSS + shadcn/ui, TanStack Query, TanStack Table    |
| Backend  | NestJS + TypeScript (strict)                                |
| ORM / DB | Prisma + PostgreSQL 16 (application tables in schema `pm`)  |
| Proxy    | Caddy — serves the built frontend, reverse-proxies `/api`   |
| Logging  | pino, structured JSON to a mounted volume                   |

`packages/shared` holds the Zod schemas + types imported by **both** apps, so no
request/response shape can drift between client and server.

## Prerequisites

- **Docker** and **Docker Compose** on the host machine. That is the only runtime
  dependency — Node, pnpm and Postgres all run inside containers.
- For local development outside Docker: Node ≥ 20 and pnpm 9 (`npm i -g pnpm@9`).

## First run

```bash
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, SESSION_SECRET (openssl rand -hex 32),
# and BOOTSTRAP_OWNER_EMAIL / BOOTSTRAP_OWNER_PASSWORD.

docker compose up --build
```

On start the `api` container applies the committed Prisma migrations, runs the
idempotent seed (item catalog + the first OWNER user from `BOOTSTRAP_OWNER_*`), then
boots. When all three containers are healthy:

- App: **http://localhost/** (or `http://<machine-ip>/` from another device)
- API health: **http://localhost/api/health** → `{"status":"ok", ...}`

The `SPARES` and `CONSUMABLES` systems are auto-created per project by the app (Phase 3);
the seed only fills the global item catalog and the bootstrap owner.

## Access from phones / tablets on the office wifi

Every device must be on the same wifi as the host. Two ways to reach it:

1. **By IP** — find the host IP (`ipconfig getifaddr en0` on macOS, `hostname -I` on
   Linux) and open `http://<that-ip>/`.
2. **By mDNS name** — most machines advertise `<hostname>.local`. Open
   `http://<hostname>.local/`. macOS (Bonjour) and modern Android/iOS resolve `.local`
   names on the LAN with no extra setup.

## Plain HTTP vs HTTPS

This deployment currently serves **plain HTTP (Option B)** — simplest on a trusted LAN,
no certificates. Trade-offs:

- **Android/Chrome:** the app cannot be _installed_ as a PWA (no secure context); it
  works as a normal bookmarked website. **iPhone/iPad:** "Add to Home Screen" still
  works and uses the manifest.
- Session cookies are **not** marked `Secure` (fine on an isolated LAN; keep
  `COOKIE_SECURE=false`).

### Switching to HTTPS (Option A) — keeps PWA install on Android

1. In `caddy/Caddyfile`, comment out the `:80 { … }` block and uncomment the
   `waterpm.local { tls internal … }` block (adjust the hostname).
2. In `docker-compose.yml`, uncomment the `443:443` port on the `caddy` service.
3. In `.env`, set `COOKIE_SECURE=true`.
4. `docker compose up --build`. Caddy mints a certificate from its internal CA.
5. Install Caddy's **root** certificate on each device once (export it from the
   `caddy` container's `/data/caddy/pki/authorities/local/root.crt`, or fetch via the
   Caddy admin API) so browsers trust it. ~2 minutes per device.

## Project layout

```
apps/api          NestJS API (controllers → services → Prisma)
apps/web          React PWA
packages/shared   Zod schemas + shared types (money, dates, enums, contracts)
caddy/            Caddyfile + web-build/serve Dockerfile
docker-compose.yml
```

## Conventions worth knowing

- **Money** is always a decimal _string_ (never a JS float). Arithmetic uses scaled
  BigInts; display uses `Intl.NumberFormat('en-IN', INR)`. See `packages/shared/src/money.ts`.
- **Calendar dates** (`sentOn`, `startDate`, `spentOn`) are `YYYY-MM-DD` strings
  end-to-end to avoid timezone drift. See `packages/shared/src/date.ts`.
- **Soft delete everywhere** via `deletedAt`; `Item` deactivates via `isActive` instead
  of deleting. Optimistic locking on `Project` and `Entry` via `version`.

## Local development (without Docker)

Requires a reachable Postgres and a `.env` with `DATABASE_URL` pointing at it.

```bash
pnpm install
pnpm --filter @water-pm/shared build
pnpm --filter @water-pm/api prisma:migrate:dev   # create/apply migrations
pnpm --filter @water-pm/api prisma:seed
pnpm dev:api    # NestJS on :3000
pnpm dev:web    # Vite on :5173, proxying /api -> :3000
```

## Quality gates

```bash
pnpm typecheck        # strict TS across all packages
pnpm lint             # ESLint (no `any`)
pnpm format:check     # Prettier
pnpm --filter @water-pm/shared test   # unit tests (money, dates, matcher…)
```

A Husky pre-commit hook runs lint-staged; commit messages are checked against
Conventional Commits.

## Backups

A backup is a single `.sql` dump written to `./backups`:

```bash
scripts/backup.sh                              # or  pwsh -File scripts\backup.ps1
scripts/restore.sh backups/uniquepm-…​.sql      # restore (overwrites current data)
```

Schedule `backup.sh` / `backup.ps1` nightly, test the restore into a scratch database, and copy
the newest dump to cloud storage weekly. Full instructions — Windows host, phone/tablet clients,
scheduling and cloud upload — are in **[SETUP.md](SETUP.md)**.

## Setup & operations

See **[SETUP.md](SETUP.md)** for the complete guide: running the host on Windows, connecting iOS /
Android / Windows devices over the office wifi, backups & restore, and daily operation.

## Build phases

Built in reviewed phases (see [PROGRESS.md](PROGRESS.md)). All eight phases are complete:
scaffold → auth/users → clients/projects/systems → items + autocomplete → entries/expenses +
rollups → analysis + CSV → settings (item merge) → backups + this documentation.
