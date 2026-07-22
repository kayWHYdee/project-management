# Progress

_Where we are, phase by phase. Pairs with [VISION.md](VISION.md) (what/why) and
[ARCHITECTURE.md](ARCHITECTURE.md) (how). We stop for review at the end of every phase._

Legend: ✅ done · 🔜 next · ⬜ not started

---

## Phase status

| #   | Phase                                                               | Status |
| --- | ------------------------------------------------------------------- | ------ |
| 1   | Monorepo scaffold, Docker Compose, Prisma schema + migration + seed | ✅     |
| 2   | Auth, users, roles, audit log, exception filter, logging            | ✅     |
| 3   | Clients → Projects → Systems CRUD (+ auto Spares/Consumables)       | ✅     |
| 4   | Items module + autocomplete matcher (+ full test suite)             | ✅     |
| 5   | Entries + expenses, add-entry form, project detail with rollups     | ✅     |
| 6   | Analysis view, filters, CSV export                                  | 🔜     |
| 7   | Settings: items (incl. merge), users                                | ⬜     |
| 8   | Backups (nightly pg_dump + tested restore), full README             | ⬜     |

---

## Phase 1 — done (2026-07-21)

**Delivered**

- pnpm monorepo (`apps/api`, `apps/web`, `packages/shared`); strict TS, `any` banned;
  ESLint (flat) + Prettier; Husky pre-commit (lint-staged) + commit-msg (commitlint);
  `.env.example` committed, `.env` gitignored.
- `packages/shared` dual-built (CJS+ESM): money (decimal-string + BigInt math), dates
  (`YYYY-MM-DD`, tz-safe), enums, health contract. **12 unit tests green.**
- Prisma schema in `pm`; `0001_init` migration committed (6 indexes + analysis index,
  Entry item-XOR-customName CHECK constraint, `Expense.createdById` optional). Idempotent
  seed (30 items with categories + first OWNER from env).
- NestJS bootstrap: `/api/health` (round-trips DB), pino JSON logging to a volume,
  Zod-validated env config, global Prisma module.
- React 19 + Vite + Tailwind + shadcn base + TanStack Query; PWA manifest + SW; live
  health card.
- Docker Compose (postgres 16 + api + caddy), Dockerfiles, Caddyfile (HTTP, Option-A ready),
  README.

**Verification**

| Gate                                | Result                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm -r build`                     | ✅                                                                                      |
| `pnpm -r typecheck`                 | ✅                                                                                      |
| `pnpm lint`                         | ✅ 0 errors                                                                             |
| `pnpm format:check`                 | ✅                                                                                      |
| shared tests                        | ✅ 12/12                                                                                |
| `prisma validate` + seed type-check | ✅                                                                                      |
| `docker compose up`                 | ⚠️ **not run** — Docker isn't installed on the dev Mac; must be verified on the mini PC |

**Known follow-ups / notes**

- `docker compose up` still needs a real run on the target machine (or Docker Desktop here).
- `.env`: `POSTGRES_PASSWORD` and the password embedded in `DATABASE_URL` must be kept in
  sync (documented in README/.env.example).
- Seed item `____Head` is a placeholder to be renamed in Settings (Phase 7).

---

## Phase 2 — done (2026-07-22)

**Delivered**

- **Sessions**: DB-backed `Session` table (migration `0002_sessions`); signed httpOnly cookie
  carries a random token whose SHA-256 hash is stored; sliding 7-day expiry; revocable.
- **Auth API**: `POST /auth/login` (throttled), `POST /auth/logout`, `GET /auth/me`,
  `POST /auth/change-password`. argon2id hashing. Generic login failure message (no user
  enumeration). Password change revokes all sessions.
- **Guards**: global `AuthGuard` (`@Public()` opt-out) + `RolesGuard` (`@Roles('OWNER')`),
  enforced server-side. `@nestjs/throttler` global + tight on login.
- **Users API** (OWNER-only): list / create (owner-set password) / update (name, role,
  isActive). Email lowercased + unique. Guards the last active OWNER from lock-out. Deactivation
  or role change revokes that user's sessions immediately.
- **Cross-cutting**: global exception filter (typed domain errors → clean HTTP; Zod → 400 with
  field errors; Prisma P2002/P2025 mapped; nothing else leaks — generic 500). `AuditService`
  writes before/after rows on user mutations. `ZodValidationPipe` validates every payload with
  the shared schema.
- **Web**: react-router; typed API client with `ApiError`; `useSession`/`useLogin`/`useLogout`/
  `useChangePassword`; login page; authenticated app shell (role-aware nav, sign-out);
  route guards (`RequireAuth`, `RequireOwner`); Settings → Users (list, add-user dialog,
  role change, activate/deactivate); change-password screen; hand-written shadcn UI primitives.
- **Contracts** in `packages/shared`: `auth`, `user`, `api-error`.

**Verification**

| Gate                         | Result                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| `pnpm -r build`              | ✅                                                                     |
| `pnpm -r typecheck`          | ✅                                                                     |
| `pnpm lint` / `format:check` | ✅                                                                     |
| shared unit tests            | ✅ 21/21 (money, dates, auth, user schemas)                            |
| api unit tests               | ✅ 12/12 (password argon2, exception-filter mapping, last-owner guard) |
| integration / e2e            | ⚠️ **not run** — need a live Postgres; deferred to the mini PC / CI    |
| `docker compose up`          | ⚠️ still needs a real run on the target (Docker not on the dev Mac)    |

**Known follow-ups**

- Integration tests (login, role gating, audit-row-on-mutation) and the Playwright e2e smoke
  are written into the plan but need a database to execute; wire them on the target or in CI.
- Expired-session pruning is opportunistic (per request). A periodic prune can come with the
  Phase 8 cron work if the `Session` table ever grows.

---

## Phase 3 — done (2026-07-22)

**Delivered**

- **Clients** CRUD: list (search), detail (with project count + their projects), create, update,
  soft-delete (blocked while active projects remain).
- **Projects** CRUD: list (filter by status/client + search), detail (carries its systems),
  create (in a transaction that auto-adds the SPARES + CONSUMABLES systems), update guarded by
  **optimistic locking** (`version` → **409** on a stale edit), soft-delete (cascades to systems).
- **Systems** CRUD: add a system to a project (label defaults to a humanised type name), update,
  soft-delete — with SPARES/CONSUMABLES **protected** (can't be manually created or removed).
- Writes gated to OWNER/EDITOR; reads for any authenticated user; every mutation audited.
- **Web**: Home dashboard (status counts + recent projects), Clients (list/search/detail/create),
  Projects (list/filters/create), Project detail (client link, **inline status edit**,
  budget/date tiles, systems cards, add/remove system). Role-aware write actions (VIEWER read-only).
- Also folded in the two review fixes: **trust-proxy** (real client IP for rate limiting) and
  **audit on auth events** (login / logout / password-change).

**Verification**

| Gate                          | Result                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `pnpm -r build` / `typecheck` | ✅                                                          |
| `pnpm lint` / `format:check`  | ✅                                                          |
| shared unit tests             | ✅ 29/29 (adds client + project schema tests)               |
| api unit tests                | ✅ 18/18 (adds optimistic-lock, auto-system, client-delete) |
| integration / e2e             | ⚠️ still need a live Postgres — pending on the mini PC / CI |

**Deferred (small, noted)**

- **Client edit** UI not built yet (create + view + delete are). The API `PATCH /clients/:id`
  exists; just needs a dialog. Easy add.
- No new migration this phase (Clients/Projects/Systems tables already existed from `0001_init`).

---

## Phase 4 — done (2026-07-22)

**Delivered**

- **The matcher** (`packages/shared/src/item-matcher.ts`): pure, exported `matchItems(query, items)`.
  Tokenise + lowercase; every query token must prefix some name token (order-independent); rank
  exact → startsWith → all-tokens → substring; within a tier by sortOrder then name; inactive
  excluded; empty query → all active in catalog order. Hand-written (no regex-from-input, no
  fuzzy lib), with **9 exhaustive tests** covering every brief example.
- **Items API**: `GET /items` (active; `?includeInactive=true`), `POST /items` (inline add —
  any role except VIEWER; duplicate name → 409 with a field error; audited). User-added items
  sort after the curated seed catalog.
- **Web**: `ItemCombobox` (live narrowing via the matcher, keyboard nav, inline "+ Add"),
  `AddItemConfirmDialog` (the deliberate mild friction — exact name + "did you mean…?" near
  matches), and `ItemPicker` (batteries-included: combobox + inline-add flow) ready to drop into
  the Phase 5 entry form. A minimal **Items** catalog page + nav link demonstrates it.

**Verification**

| Gate                          | Result                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `pnpm -r build` / `typecheck` | ✅                                                          |
| `pnpm lint` / `format:check`  | ✅                                                          |
| shared unit tests             | ✅ 38/38 (adds 9 matcher tests)                             |
| api unit tests                | ✅ 20/20 (adds item create / duplicate-name)                |
| integration / e2e             | ⚠️ still need a live Postgres — pending on the mini PC / CI |

**Notes**

- Item rename / category change / activate-deactivate / **merge** / usage counts are **Phase 7**
  (Settings → Items). Phase 4 is list + inline-add + the matcher only.

---

## Phase 5 — done (2026-07-22)

**Delivered** — the core "what did we send, what did we spend":

- **Entries API**: create / update / delete + list-per-project. Amount = quantity × rate when a
  rate is present (**server-computed, authoritative**), else manually enterable. `customName`
  only accepted for SPARES/CONSUMABLES (service rule + DB check constraint + Zod refine).
  Optimistic locking (`version` → 409). Soft-delete. `createdById` from the session. Audited.
- **Expenses API**: create / update / delete + list-per-project (category, amount, spentOn, note).
- **Project summary endpoint** (`GET /projects/:id/summary`): budget vs spent (materials +
  expenses) vs remaining, plus **per-item rollups** (total qty, total value, entry count) — all
  money math via the shared decimal helpers.
- **Web add-entry form**: fast, keyboard-first (system → item picker (autofocus) → qty → unit →
  date=today → rate → …), live amount preview, **"Save & add another"** (keeps system + date),
  and a custom-name toggle for Spares/Consumables.
- **Web project detail** rebuilt: budget/spent/remaining tiles, entries **grouped by system**,
  an **item summary table that expands** to the entries behind each total, and an expenses list
  with an add form. Role-aware (VIEWER read-only).

**Verification**

| Gate                          | Result                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `pnpm -r build` / `typecheck` | ✅                                                                 |
| `pnpm lint` / `format:check`  | ✅                                                                 |
| shared unit tests             | ✅ 49/49 (adds rollup math, financials, entry refine, sumQuantity) |
| api unit tests                | ✅ 24/24 (adds amount compute, custom-name rule, entry lock)       |
| integration / e2e             | ⚠️ still need a live Postgres — pending on the mini PC / CI        |

**Notes**

- Entry _edit_ has an API + optimistic lock but no dedicated UI yet (delete + re-add is the
  primary flow, matching the "entries are records, not assets" grain). Easy to add an edit dialog.
- No new migration (Entry/Expense tables existed from `0001_init`).

---

## Phase 2 — original plan (for reference)

**Goal:** a user can log in, sessions are enforced by role across the API, and every mutating
request is audited. No client/project features yet — this is the security spine.

### Backend (`apps/api`)

1. **Session infrastructure** — cookie-based sessions (`httpOnly`, `sameSite=lax`,
   `Secure` = `COOKIE_SECURE`). Store: Postgres-backed session table in `pm` (survives
   restarts, no extra service) or signed cookie — decide at start of phase; leaning
   Postgres-backed for revocability. Sign with `SESSION_SECRET`.
2. **Auth module** — `POST /api/auth/login` (email+password, argon2id verify, email lowercased
   to match seed), `POST /api/auth/logout`, `GET /api/auth/me`. Rate-limit login attempts.
3. **Password hashing service** — argon2id wrapper (params centralised).
4. **Guards & decorators** — `AuthGuard` (valid session) + `RolesGuard` with a `@Roles(...)`
   decorator and a `@CurrentUser()` param decorator. `VIEWER` read-only, `EDITOR` full data,
   `OWNER` full incl. users. Enforced server-side, not just UI.
5. **Users module** (OWNER-only) — list, create (sets temp password), deactivate, change role.
   No hard delete (`isActive`).
6. **Audit interceptor/service** — every mutating endpoint writes an `AuditLog` row with
   `before`/`after` JSON + `userId` from the session. Implement once as a reusable
   interceptor so feature modules get it for free.
7. **Exception filter** — global filter mapping typed domain errors (e.g. `NotFoundError`,
   `ConflictError` for stale `version`, `ForbiddenError`) to proper HTTP codes and **safe**
   messages. Raw Prisma errors / stack traces never leak. Zod validation errors → 400 with
   field details.
8. **Contracts in `packages/shared`** — `loginRequest`, `sessionUser`, `user` CRUD schemas,
   role enum reuse. Everything validated both sides.

### Frontend (`apps/web`)

9. **Auth state** — `useSession` (TanStack Query on `/auth/me`), login page (RHF + Zod),
   logout, and a route guard that redirects unauthenticated users to login.
10. **App shell** — minimal authenticated layout (nav + user menu) so later phases have a
    home. Role-aware nav (hide Users from non-OWNER).
11. **Settings → Users** screen (OWNER-only) wired to the users module.

### Tests

12. Integration tests (API against a test DB): login success/failure, session expiry, role
    gating (VIEWER blocked from writes, non-OWNER blocked from users), audit-row written on a
    mutation. Unit test the exception filter mapping.

### Phase 2 acceptance

- Log in as the seeded OWNER; `/auth/me` returns the session user.
- A VIEWER cannot POST; a non-OWNER cannot reach `/users`; both enforced by the API.
- Creating/deactivating a user writes an `AuditLog` row.
- A forced error returns a clean JSON error, no stack trace.

---

## How to run what exists today

> After bring-up you now land on a **login page**. Sign in with the bootstrap OWNER from your
> `.env` (`BOOTSTRAP_OWNER_EMAIL` / `BOOTSTRAP_OWNER_PASSWORD`), then Settings → Users to add
> the rest of your staff. Change the owner password from Settings → Password afterwards.

**Option A — Docker (matches production; needs Docker installed):**

```bash
cp .env.example .env   # set POSTGRES_PASSWORD, SESSION_SECRET, BOOTSTRAP_OWNER_*
docker compose up --build
```

- App → **http://localhost/**
- API health → **http://localhost/api/health**
- From another device on the wifi → `http://<host-ip>/` or `http://<hostname>.local/`

**Option B — dev servers (no Docker; needs a reachable Postgres + `.env` with `DATABASE_URL`):**

```bash
pnpm install
pnpm --filter @water-pm/shared build
pnpm --filter @water-pm/api prisma:migrate:dev
pnpm --filter @water-pm/api prisma:seed
pnpm dev:api    # http://localhost:3000  (health: http://localhost:3000/api/health)
pnpm dev:web    # http://localhost:5173  ← open THIS one in the browser
```

In dev, the Vite dev server on **http://localhost:5173** proxies `/api` to the API on
:3000, so open **http://localhost:5173**.
