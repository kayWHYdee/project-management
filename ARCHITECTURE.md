# Architecture

_How the system is built. Pairs with [VISION.md](VISION.md) (what/why) and
[PROGRESS.md](PROGRESS.md) (status)._

---

## 1. Topology

Everything runs on one mini PC under Docker Compose, reached over the office LAN.

```
        Phone / Tablet / Desktop  (same wifi)
                     │  http://<host>/  (port 80, Option B plain HTTP)
                     ▼
              ┌──────────────┐
              │    Caddy     │  serves built PWA (/srv), reverse-proxies /api
              └──────┬───────┘
             /api    │            static files
                     ▼
              ┌──────────────┐
              │   api (Nest) │  :3000, global prefix /api
              └──────┬───────┘
                     │  Prisma (schema=pm)
                     ▼
              ┌──────────────┐
              │ db (Postgres)│  not published to host; only api reaches it
              └──────────────┘

Volumes: pgdata (db), apilogs (JSON logs), uploads (files, later), caddydata/config
```

- **Caddy** is the only container with a published port. TLS is off today (Option B); the
  `Caddyfile` carries a commented Option-A block (HTTPS via Caddy's internal CA) for later.
- **Postgres** is never exposed to the LAN — only the `api` service connects to it.

## 2. Monorepo layout

```
apps/api          NestJS API
apps/web          React 19 PWA (Vite build)
packages/shared   Zod schemas + shared types — imported by BOTH apps
caddy/            Caddyfile + Dockerfile (builds & serves web, proxies api)
docker-compose.yml
```

pnpm workspaces. `packages/shared` is **dual-built** (CJS for NestJS, ESM for Vite) because
Rollup can't resolve named exports through CommonJS `export *`. Two tsconfigs
(`tsconfig.cjs.json` / `tsconfig.esm.json`) + `scripts/finalize-dist.mjs` stamp each output
folder with its module `type`.

## 3. The contract layer (`packages/shared`)

**Single source of truth for every request/response shape.** A field cannot drift between
client and server because both sides import the same Zod schema — the API validates with it,
the web app derives form validation and TypeScript types from it.

Current modules:

- `money.ts` — money as a **decimal string**, never a float. `moneySchema` (Decimal 14,2),
  `quantitySchema` (12,3), `computeAmount`, `sumMoney` (scaled-BigInt math), `formatInr` (en-IN).
- `date.ts` — **calendar dates as `YYYY-MM-DD` strings** end-to-end. `isoDateSchema`,
  `isoDateToUtcDate` / `utcDateToIsoDate` (Prisma `@db.Date` bridge, UTC-midnight anchored),
  `todayIsoDate` (default `Asia/Kolkata`). Prevents the classic off-by-one date shift.
- `enums.ts` — domain enums (must mirror the Prisma enums). Includes `allowsCustomName`
  (SPARES + CONSUMABLES) and `humaniseSystemType`.
- `health.ts` — the Phase-1 health contract. Feature contracts get added here as their
  modules land.

## 4. API design (NestJS)

Strict layering, one responsibility per file (~300-line split signal):

- **Controllers** — HTTP only: routing, status codes, DTO in/out. No business logic.
- **Services** — business rules (e.g. "customName only for SPARES/CONSUMABLES", amount
  computation, optimistic-lock checks, soft-delete filtering).
- **Prisma** — data access via a single global `PrismaService` (schema `pm`). Never called
  from controllers.

Cross-cutting (built out over the phases):

- **Config** — `envSchema` (Zod) parsed once at boot; fail-fast on bad env. Typed
  `AppConfigService` wrapper; the rest of the app never touches `process.env`.
- **Logging** — pino structured JSON. Production writes to stdout **and** a file on the
  `apilogs` volume; dev pretty-prints. Cookies/authorization headers redacted.
- **Errors** _(Phase 2)_ — an exception filter maps typed domain errors to HTTP status +
  safe messages; raw Prisma errors and stack traces never reach the client.
- **Audit** _(Phase 2)_ — every mutating endpoint writes an `AuditLog` row (before/after JSON).

## 5. Data model & integrity

Prisma schema, all tables in **schema `pm`**. Key integrity rules encoded in the DB and/or
service layer:

- **No unique on `(systemId, itemId)`** — repeated entries of the same item are normal.
- **Entry item-XOR-customName** — a DB `CHECK` constraint enforces exactly one of `itemId`
  / `customName`; a Zod refinement mirrors it. `customName` is further restricted to
  SPARES/CONSUMABLES systems in the service layer.
- **Soft-delete everywhere** via `deletedAt`; default queries filter it out. `Item` is the
  exception: it deactivates via `isActive` (deletion blocked if any entry references it).
- **Optimistic locking** on `Project` and `Entry` via a `version` column → HTTP **409** on a
  stale update.
- **Indexes** for the hot paths, including `Entry(itemId)` for the cross-project analysis view.

### Schema separation (future-proofing)

The app owns `pm` and nothing else. A future inventory app will own an `inventory` schema in
the **same** Postgres instance. The two never share tables; any cross-app data flow is over
HTTP, not SQL joins. This is why we never use the `public` schema.

## 6. Frontend (React 19 PWA)

- Vite build, TypeScript strict. Tailwind + shadcn/ui (New York), TanStack Query + Table,
  React Hook Form + Zod (schemas from `packages/shared`).
- **Network-only** by design: no offline caching of API responses (avoids stale-data bugs).
  TanStack Query configured `staleTime: 0, gcTime: 0`.
- **PWA**: manifest + service worker precache the app shell only; `/api` is denylisted from
  any caching. Installable on HTTPS (Option A); on plain HTTP it degrades to a bookmark on
  Android (iOS "Add to Home Screen" still works).
- Responsive down to phone width; tables collapse to cards on small screens (built per screen).
- Money shown with `Intl.NumberFormat('en-IN', INR)`; dates as `YYYY-MM-DD`.

## 7. Auth & security (Phase 2)

- Session cookies: `httpOnly`, `sameSite=lax`, `Secure` only under HTTPS (`COOKIE_SECURE`).
- `argon2id` password hashing.
- Role gate: `OWNER` / `EDITOR` / `VIEWER` enforced server-side (guards), not just in the UI.
- No secrets in the repo — `.env` (gitignored) + committed `.env.example`.

## 8. Build, migrations, ops

- **Migrations only via Prisma Migrate**, committed to git. The `api` container runs
  `prisma migrate deploy` → idempotent seed → boot on startup.
- **Backups** _(Phase 8)_ — nightly `pg_dump` to a mounted host directory + a tested restore
  procedure.
- Quality gates: `pnpm typecheck` / `lint` (no `any`) / `format:check` / package tests.
  Husky pre-commit (lint-staged) + commit-msg (Conventional Commits).
