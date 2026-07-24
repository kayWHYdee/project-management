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

## Three layers, all wired up

- **Unit** — fast, no external deps. `pnpm -r test`.
- **Integration** — the real NestJS app against a throwaway Postgres spun up by **Testcontainers**
  (needs Docker). `pnpm --filter @water-pm/api test:int`.
- **End-to-end** — one **Playwright** smoke path in a real browser against a running stack.
  `pnpm --filter @water-pm/web e2e` (after `… e2e:install` once for the browser).

## Commands

```bash
pnpm -r test                         # all unit tests (shared + api + web)
pnpm -r typecheck                    # strict types across the monorepo
pnpm lint                            # ESLint (no `any`)

# integration (needs Docker; Testcontainers starts its own Postgres):
pnpm --filter @water-pm/api test:int

# e2e (needs the stack running at E2E_BASE_URL, default http://localhost):
pnpm --filter @water-pm/web e2e:install   # once, downloads the browser
E2E_OWNER_EMAIL=owner@example.com E2E_OWNER_PASSWORD=… \
  pnpm --filter @water-pm/web e2e
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

## Integration — `apps/api/test/app.int-spec.ts` (5 tests)

Boots the real app against a fresh Testcontainers Postgres with the actual migrations applied:

- Login returns the session user from `/auth/me` (signed cookie round-trip).
- A wrong password → generic 401 (`"Invalid email or password"`).
- A VIEWER is refused a write (`403`); an OWNER succeeds and an `AuditLog` row is written.
- A non-OWNER is refused `GET /users` (`403`).
- An invalid payload → 400 `VALIDATION` with `fieldErrors` (the shared Zod schema on the server).

## End-to-end — `apps/web/e2e/smoke.e2e.ts` (Playwright, 1 smoke path)

The brief's single smoke test, in a real browser against the running stack — **and it cleans up
after itself** (deletes the client + project it creates), so it's safe to run against a live
instance:

- Log in → create client → create project (auto Spares/Consumables present) → add an entry via the
  autocomplete → see it in the item summary → find it in the Analysis view → delete project + client.
