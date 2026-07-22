# Testing

_How we test, why, and exactly what is covered. Pairs with [ARCHITECTURE.md](ARCHITECTURE.md)
and [PROGRESS.md](PROGRESS.md)._

---

## Principles

1. **Tests where they earn their keep.** We don't chase a coverage number. We test the things
   that are (a) easy to get subtly wrong and (b) expensive if they are: money math, calendar
   dates, validation rules, password hashing, error mapping, and authorization invariants.
2. **Push logic down to pure functions, test it there.** The autocomplete matcher, money
   rollups, and date handling live in `packages/shared` as pure, dependency-free functions —
   the cheapest possible place to test exhaustively.
3. **Unit tests have no external dependencies.** They instantiate a class directly or mock its
   collaborators (e.g. a fake `PrismaService`). No database, no network, no clock surprises
   (dates are pinned). This keeps them fast and deterministic.
4. **Integration tests exercise a real database.** Each API module is tested against a real
   Postgres (a disposable test schema), because the things most likely to break there —
   constraints, the item-XOR-customName CHECK, cascades, transactions — only exist in the DB.
5. **One end-to-end smoke test, kept green.** A single Playwright path (log in → create client →
   create project → add system → add entry → see it in analysis) catches the majority of
   wiring regressions without the cost of a big e2e suite.
6. **One framework, colocated tests.** Vitest everywhere. Shared/web use `*.test.ts`; the API
   uses `*.spec.ts`. SWC transpiles NestJS decorators under Vitest so DI-style classes test
   cleanly.
7. **Assert behaviour, not implementation.** Tests call the public surface (a schema's
   `parse`, a service method, the exception filter's `catch`) and assert the observable result.

## What needs a database (and therefore isn't run on the dev machine yet)

The dev machine has no Docker/Postgres, so **integration and e2e tests are written into the
plan but not yet executed** — run them on the mini PC or in CI where a Postgres is available.
Everything below marked _unit_ runs today with `pnpm -r test`.

## Commands

```bash
pnpm -r test                        # all unit tests (shared + api)
pnpm --filter @water-pm/shared test # shared only
pnpm --filter @water-pm/api test    # api only
pnpm -r typecheck                   # strict types across the monorepo
pnpm lint                           # ESLint (no `any`)
```

---

## Test inventory

### `packages/shared` — unit (21 tests)

**`money.test.ts`**

- `computeAmount` multiplies quantity × rate with 2dp half-up rounding
- `computeAmount` rounds correctly at the 0.005 boundary
- `computeAmount` handles large in-range values with no float error
- `sumMoney` sums without floating-point drift; handles the empty list
- `moneySchema` / `quantitySchema` accept valid decimals
- …reject too many decimal places
- …reject non-numeric strings
- `formatInr` formats en-IN with Indian digit grouping

**`date.test.ts`**

- `isoDateSchema` accepts valid calendar dates
- …rejects malformed / impossible dates (`2026-13-01`, `2026-02-30`, `21-07-2026`, `2026-7-1`)
- Timezone stability: an ISO date round-trips through Prisma-style UTC dates unchanged
- Wall-clock date is read correctly in `Asia/Kolkata` near UTC midnight

**`auth.test.ts`**

- `loginRequestSchema` lowercases and trims the email
- …rejects an invalid email or empty password
- `passwordSchema` enforces the minimum length
- `changePasswordRequestSchema` requires the new password to differ from the current one
- …accepts a valid change

**`user.test.ts`**

- `createUserRequestSchema` accepts a valid user and normalises name/email
- …rejects a short password or unknown role
- `updateUserRequestSchema` requires at least one field
- …accepts a single-field update

### `apps/api` — unit (12 tests)

**`auth/password.service.spec.ts`**

- Hashes to an `$argon2id$` string and verifies the correct password
- Rejects a wrong password
- Returns `false` for a malformed hash instead of throwing

**`common/filters/all-exceptions.filter.spec.ts`**

- Maps a domain error to its status and code
- Includes field errors from a `ValidationError`
- Maps a `ZodError` to a 400 with field errors
- Maps a Nest `HttpException`
- Maps a Prisma unique-violation (P2002) to 409
- Hides unexpected errors behind a generic 500 (no leak)

**`users/users.service.spec.ts`** (mocked Prisma)

- Blocks demoting the last active OWNER
- Blocks deactivating the last active OWNER
- Allows demotion when another active OWNER exists, and revokes that user's sessions

---

## Planned but not yet executed (need a database)

### API integration (per module, against a test Postgres)

- **Auth**: login success sets a session cookie; wrong password / inactive user → 401 with the
  same generic message; `/auth/me` returns the session user; logout revokes the session;
  change-password invalidates existing sessions.
- **Users**: OWNER can create/list/update; a VIEWER/EDITOR is refused (`403`); creating a
  duplicate email → 409; a mutation writes an `AuditLog` row.
- **Guards**: an unauthenticated request to a protected route → 401; a non-OWNER to `/users` → 403.

### End-to-end (Playwright, one smoke path)

- Log in → create client → create project → add a system → add an entry → verify it appears in
  the analysis view. (Arrives with the features it exercises, Phases 3–6.)
