# Vision & Requirements

_A living document. This is where we agree on **what** we're building and **why**, before
arguing about **how** (that's [ARCHITECTURE.md](ARCHITECTURE.md)) or **when** (that's
[PROGRESS.md](PROGRESS.md))._

---

## 1. The one-line vision

> For each project, tell me its **status**, what we've **sent** to it, and what we've **spent**.

This is a **project-management** tool for a water-treatment business, not an inventory system.
It should feel fast enough to use one-handed on a phone standing at a site, and boring enough
to still be maintainable in five years.

## 2. Who uses it

- **≤ 5 users**, office staff only. Roles: `OWNER` (everything incl. user management),
  `EDITOR` (all data, no user management), `VIEWER` (read-only).
- Runs on **one always-on mini PC on the office LAN**. Accessed from desktop browsers and
  from phones/tablets on the same wifi. **No internet required, no offline mode.**

## 3. What the business does

We construct and maintain swimming **pools**, **fountains**, **sewage treatment plants (STP)**,
**water treatment plants (WTP)**, and **RO plants**.

## 4. Domain model — the core idea

```
Client  →  Project  →  System  →  Entry
```

- **Client** — a customer; usually has several projects.
- **Project** — a physical site + the body of work there. Holds status, budget, description.
- **System** — one of our offerings installed at that project: Pool / Fountain / RO / STP / WTP,
  plus two special buckets `SPARES` and `CONSUMABLES` auto-created on every project. A project
  can have several systems of the same type (e.g. two pools), distinguished by label.
- **Entry** — a record that _a quantity of an item was sent to a system on a date_.

**An entry is deliberately not an asset.** It has no lifecycle. If 3 membranes go out in March
and 2 more in July, that's two rows — we never reconcile or deduplicate them. This grain is
chosen on purpose.

### Money & figures are internal

All rates, amounts, budgets and spend are for **our** eyes only. The client/customer never
sees any of this. Amount = quantity × rate when a rate is present (server-computed and
authoritative); otherwise it can be entered manually.

## 5. Scope

### In scope (v1)

Status tracking, entries (what was sent), expenses (what was spent), budget vs spent,
item catalog with smart autocomplete, cross-project analysis by item, CSV export, users/roles,
audit log, nightly backups.

### Explicitly out of scope for v1 (don't build — but don't make impossible)

Stock levels, reorder points, warehouse locations, serial-number tracking, asset lifecycle
(install/service/replace), warranty tracking, complaint/ticket management.

> A separate **inventory** application may come later as its own app, sharing the same
> Postgres instance via a separate `inventory` schema. The two apps must never share tables;
> any cross-app reads would happen over HTTP. This app owns only the `pm` schema.

## 6. The screens (target v1)

1. **Login**
2. **Dashboard** — project count by status, total spend this month, recently updated projects
3. **Clients** — searchable; client detail shows their projects
4. **Project list** — filter by status/client, sortable, searchable
5. **Project detail** — the main working screen: header (status inline-editable, budget/spent/
   remaining), systems cards (Spares/Consumables always present), entries grouped by system,
   per-item rollups (expandable to the entries behind each total), expenses
6. **Add entry** — highest-traffic form; keyboard-first: system → item (autocomplete) → qty →
   unit → date (defaults today) → description → received-by → rate. "Save and add another"
   keeps system + date. Only system, item, qty, date required.
7. **Analysis** — pick an item, see every entry across all projects; summary cards
   (total qty / project count / total value); filter by client, status, system type, date
   range; row click opens the project; CSV export
8. **Settings → Items** — list, add, rename, category, activate/deactivate, usage count,
   **merge** (repoint all entries from one item to another)
9. **Settings → Users** — OWNER only

## 7. The most important interaction: item autocomplete

A combobox that narrows live as you type. Token-prefix matching, order-independent,
case-insensitive (`well pu` → "Open Well Pump"). Ranked: exact → starts-with → all-tokens →
substring. Inline "add new item" has **deliberate mild friction** (a confirm dialog showing
the exact name + "did you mean…?") because typos here create duplicate items. Renaming is
**only** in Settings, never from the entry form.

## 8. Non-negotiables on quality

Strict TypeScript, `any` banned. One source of truth for every request/response shape
(Zod in `packages/shared`). Layered API (controllers → services → Prisma). Money as decimals,
never float. Calendar dates never drift across timezones. Soft-delete everywhere. Tests where
they earn their keep (autocomplete matcher, money rollups, validation, one e2e smoke).
**Prefer boring, well-understood solutions over clever ones.**

## 9. Open questions / decisions log

| #   | Topic                      | Decision                                                                                                     | Date       |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | `customName` on entries    | Allowed for **both** SPARES and CONSUMABLES systems                                                          | 2026-07-21 |
| 2   | `Entry.amount` with a rate | Server computes qty×rate, authoritative; manual only when no rate                                            | 2026-07-21 |
| 3   | Calendar dates             | `YYYY-MM-DD` strings end-to-end (default zone Asia/Kolkata)                                                  | 2026-07-21 |
| 4   | `Expense.createdById`      | Optional, taken from the logged-in session, not shown in UI                                                  | 2026-07-21 |
| 5   | LAN TLS                    | **Option B: plain HTTP** (no Android PWA install; cookies not Secure). B→A documented                        | 2026-07-21 |
| 6   | Seed item `____Head`       | Placeholder; owner will rename it in Settings later                                                          | 2026-07-21 |
| 7   | First OWNER                | Bootstrapped by the seed from `BOOTSTRAP_OWNER_*` if no users exist                                          | 2026-07-21 |
| 8   | Session storage            | **DB-backed** (`Session` table in `pm`); signed cookie holds a hashed token; revocable, sliding 7-day expiry | 2026-07-22 |
| 9   | New-user passwords         | OWNER sets an initial password; user can change it later via a change-password screen                        | 2026-07-22 |
| 10  | Login security             | Basic rate limiting via `@nestjs/throttler` (tight on `/auth/login`)                                         | 2026-07-22 |

_Add rows here as we decide things. Never silently change a past decision — add a new row._
