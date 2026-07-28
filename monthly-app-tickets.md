# Monthly — Build Tickets

Personal finance dashboard: upload bank CSVs, categorize transactions, view spend by category.
Stack: React (frontend) · Node.js + Fastify (backend) · SQLite (storage) · Docker (packaging).

Tickets are grouped into epics, roughly in build order. Each has a suggested scope, acceptance criteria, and dependencies. Ticket IDs (e.g. `SETUP-1`) are stable references — link them in commits/branches as you go.

---

## Epic: SETUP — Project scaffolding

### SETUP-1: Repo structure
Set up monorepo with `/frontend` (React) and `/backend` (Fastify) as separate packages, plus root-level `docker-compose.yml`.
**AC:**
- `npm install` works in both `/frontend` and `/backend` independently
- Root README explains how to run both in dev mode

### SETUP-2: Backend skeleton
Fastify app boots, serves a health-check route (`GET /api/health`).
**AC:** `GET /api/health` returns `200 { status: "ok" }`

### SETUP-3: Frontend skeleton
React app (Vite recommended) boots, renders a placeholder dashboard page, can successfully call `GET /api/health` and display the result.
**AC:** Dev server runs, page shows backend health status

### SETUP-4: SQLite + migrations
Pick a lightweight query layer (e.g. `better-sqlite3` + a simple migration runner, or `knex`/`drizzle` if you want more structure). Set up migration tooling and a DB file created on first run.
**AC:** Running the backend for the first time creates the SQLite file and applies migrations automatically

---

## Epic: DATA — Core schema

### DATA-1: `accounts` table
Fields: `id, bank_type, custom_name, created_at`. `bank_type` is a constrained value (enum-like — validate against a hardcoded list in code, not a DB constraint you'll need to migrate later).
**AC:** Can insert/query accounts via a repository/service function

### DATA-2: `statements` table
Fields: `id, account_id (FK), month (e.g. "2026-06"), created_at`. Unique constraint on `(account_id, month)`.
**AC:** Attempting to insert a duplicate `(account_id, month)` fails or triggers replace logic (see UPLOAD-6)

### DATA-3: `categories` table
Fields: `id, name, color (constrained to preset palette values), created_at`.
**AC:** Seed migration inserts your 5 starter categories (Groceries, Fixed Costs, Savings, Eating Out, Discretionary) with distinct preset colors

### DATA-4: `rules` table
Fields: `id, substring, display_name, category_id (FK), created_at`. No `account_id` — rules are global, not account-scoped (confirm this matches your intent; if you want rules scoped per-account instead, add `account_id` here now, before transactions depend on it).
**AC:** Can insert/query rules

### DATA-5: `transactions` table
Fields: `id, statement_id (FK), date, raw_description, display_name, amount (unsigned), category_id (FK, nullable), rule_id (FK, nullable, for traceability only), created_at`.
**AC:** Can insert/query transactions; `category_id` nullable enforced

---

## Epic: PARSE — CSV ingestion

### PARSE-1: Parser interface
Define a common interface every bank parser implements, e.g. `parse(fileBuffer) → [{date, rawDescription, amount, isOutflow}]`. Keep bank-specific logic isolated per parser module.
**AC:** Interface documented; one dummy/test parser implementation passes a unit test

### PARSE-2: N26 parser
Implement parsing for the N26 CSV format (comma-delimited, dot-decimal, `Amount (EUR)` column). Filter to negative amounts only (expense-only, per design decision), convert to unsigned.
**AC:** Given a sample N26 CSV, returns correct transaction list with income rows excluded and amounts positive

### PARSE-3: [Your second bank] parser
Implement parsing for your other bank's format (semicolon-delimited, comma-decimal, BOM handling, `Soll`/`Haben` or signed `Betrag` column). Same expense-only filtering.
**AC:** Given a sample CSV from this bank, returns correct transaction list with income excluded

### PARSE-4: Month-boundary filtering
Given a selected `(account, month)`, drop any parsed transactions whose date falls outside that month, regardless of what's in the file.
**AC:** A CSV containing a few days from an adjacent month, uploaded for month X, only ingests month X's rows

### PARSE-5: Parser error handling
Handle malformed/unexpected CSV structure gracefully (wrong bank selected, corrupted file, encoding issues) — return a clear error rather than a crash or silent garbage data.
**AC:** Uploading a mismatched file (e.g. N26 file with "Other Bank" selected) returns a user-facing error, not a 500 or nonsense rows

---

## Epic: RULES — Categorization engine

### RULES-1: Rule matching logic
Given a raw description and the current rule set, return the best-matching rule using longest-substring-wins on ties.
**AC:** Unit tests cover: no match, single match, multiple overlapping matches (longest wins)

### RULES-2: Apply rules during import
When a statement is created, run every parsed transaction through rule matching; matched ones get `category_id` + `rule_id` set immediately, unmatched ones stay `category_id: null`.
**AC:** After upload, matched transactions show correct category without user input

### RULES-3: Create rule endpoint
`POST /api/rules` — create a new rule from `{substring, displayName, categoryId}`, typically called when the user categorizes a previously-unmatched transaction during the post-upload review step.
**AC:** Creating a rule persists it; does not retroactively affect any other existing transactions

### RULES-4: Rules management endpoints
`GET /api/rules`, `PATCH /api/rules/:id`, `DELETE /api/rules/:id`. Edits/deletes never touch existing transactions — forward-only.
**AC:** Editing a rule's category does not change already-categorized transactions; deleting a rule does not delete transactions it previously matched

---

## Epic: UPLOAD — Upload & review flow

### UPLOAD-1: Upload endpoint
`POST /api/statements` accepting a CSV file + `accountId` + `month`. Runs parser → month filter → rule matching → returns a preview (not yet committed) showing matched + unmatched transactions.
**AC:** Endpoint returns a structured preview payload the frontend can render as the categorize screen

### UPLOAD-2: Categorize-review UI
Frontend screen matching the mockup: list of transactions, pre-categorized ones shown as a solid pill, unmatched ones shown with a category-selection affordance (this is also where new rules get created, via RULES-3).
**AC:** Selecting a category for an unmatched transaction updates its state locally before commit

### UPLOAD-3: New-rule inline form
For a transaction where the user wants to create a rule (not just a one-off category), a small form to confirm/edit the suggested substring + display name + category (per Q4's design).
**AC:** Suggested substring pre-fills from the raw description (e.g. first all-caps token); user can edit before saving

### UPLOAD-4: Commit statement endpoint
`POST /api/statements/:draftId/commit` (or similar) — persists the statement + transactions (with whatever categorization state the review screen ended in, including nulls for still-uncategorized) and any newly created rules.
**AC:** Committing creates a `statements` row + all `transactions` rows correctly linked

### UPLOAD-5: "Create statement" is never blocked
Confirm the button remains enabled regardless of how many transactions are still uncategorized (soft requirement per design decision).
**AC:** Can commit a statement with 0 categorized transactions

### UPLOAD-6: Replace-on-reupload
If `(accountId, month)` already has a statement, uploading again deletes the old statement + its transactions and replaces with the new import, after a confirmation prompt.
**AC:** Re-uploading for an existing month shows a confirm dialog; confirming removes old transactions and inserts new ones; rules are untouched

---

## Epic: ACCOUNTS — Account management

### ACCOUNTS-1: Bank type registry
A hardcoded list/config mapping `bankType → {label, iconAsset, parserModule}`. This is the single place you register a new supported bank.
**AC:** Adding a new bank type requires only: new parser module + new icon asset + one new registry entry

### ACCOUNTS-2: Create account endpoint + UI
`POST /api/accounts` with `{bankType, customName}`. Simple form: dropdown (bank type) + text field (custom name).
**AC:** Can create multiple accounts of the same bank type with different custom names

### ACCOUNTS-3: List accounts endpoint
`GET /api/accounts` — used to populate the account dropdown during upload.
**AC:** Returns all accounts with their bank type's icon reference

---

## Epic: CATEGORIES — Category management

### CATEGORIES-1: CRUD endpoints
`GET/POST/PATCH/DELETE /api/categories`. Color field validated against a fixed preset palette (reject arbitrary hex values).
**AC:** Cannot create a category with a color outside the preset list

### CATEGORIES-2: Settings screen
Simple UI to list, create, rename, delete categories, picking color from a preset swatch selector.
**AC:** Deleting a category in use — decide and implement a policy (e.g. block deletion if transactions/rules reference it, or cascade to null). Document whichever you choose.

---

## Epic: TXN — Transaction editing

### TXN-1: Update transaction category endpoint
`PATCH /api/transactions/:id` — allows changing `category_id` independent of the rule that originally set it (no retroactive rule linkage).
**AC:** Editing a transaction's category does not modify any rule

### TXN-2: Delete statement endpoint
`DELETE /api/statements/:id` — removes the statement and its transactions only. Rules are untouched.
**AC:** Deleting a statement removes it from the dashboard grid; rules list is unaffected

---

## Epic: DASH — Dashboard

### DASH-1: Statements grid endpoint
`GET /api/statements` returning all statements (with account name/icon, month, total spend) sorted by month descending.
**AC:** Endpoint returns correctly sorted, flat list — no account-first grouping

### DASH-2: Dashboard UI
Grid of statement cards per the mockup — icon, bank/custom name, month, total.
**AC:** Clicking a card navigates to the statement detail view

---

## Epic: DETAIL — Statement detail view

### DETAIL-1: Statement aggregation endpoint
`GET /api/statements/:id` returning totals per category (for donut + bars) + full transaction list.
**AC:** Percentages and totals match sum of transaction amounts per category; uncategorized transactions aggregate into an "Uncategorized" bucket

### DETAIL-2: Donut + legend + progress bars UI
Render per mockup. Hover on a donut slice highlights the matching legend row (and vice versa) — pure UI state, no refetch.
**AC:** Hover interaction works both directions; no network calls triggered by hover

### DETAIL-3: Transaction list toolbar
Category filter, amount sort (asc/desc), amount range filter, above the transaction list.
**AC:** Filters combine correctly (e.g. category + amount range together); clearing filters restores full list

### DETAIL-4: Week bucketing logic (backend or shared util)
Implement: week 1 = day 1 → day before the month's first Monday; subsequent weeks Mon–Sun; final week ends on the month's last day, however long/short. Number of weeks (4 or 5) is dynamic per month.
**AC:** Unit tests across several months with different starting weekdays (e.g. month starting on Monday vs. Sunday vs. mid-week) produce correct bucket boundaries and counts

### DETAIL-5: Week selector UI
Renders dynamic number of week buttons (4 or 5) per statement; selecting a week re-scopes donut, bars, and transaction list to that week's data only.
**AC:** Switching weeks updates all three (chart, bars, list) consistently; deselecting returns to full-month view

### DETAIL-6: Rule traceability display
Each transaction row optionally shows which rule matched it (tag/tooltip), linking conceptually to the Rules screen for editing.
**AC:** Transactions with a `rule_id` show a visible reference; manually-categorized/uncategorized ones don't

---

## Epic: RULESUI — Rules settings screen

### RULESUI-1: Rules list + edit/delete UI
Table of all rules (substring, display name, category), with edit and delete actions, backed by RULES-4 endpoints.
**AC:** Editing/deleting a rule from this screen behaves per RULES-4's forward-only guarantee

---

## Epic: PKG — Packaging & distribution

### PKG-1: Dockerfile — backend
Multi-stage build, serves Fastify app, SQLite file path configurable via env var, mounted as a volume in compose.
**AC:** `docker build` succeeds; container starts and serves API

### PKG-2: Dockerfile — frontend
Build React app to static assets, serve via a lightweight static server (or serve from the Fastify backend directly — simpler for a single-container setup, worth considering).
**AC:** `docker build` succeeds; static assets served correctly

### PKG-3: docker-compose.yml
Wires frontend + backend (or single combined container, your call) with a persistent volume for the SQLite file.
**AC:** `docker compose up` from a clean clone results in a working app at `localhost:<port>`, with data persisting across `docker compose down && up`

### PKG-4: README for self-hosters
Document: how to run via Docker, which banks are currently supported, how data is stored/where, and (briefly) how to add a new bank parser for contributors.
**AC:** A stranger following the README can get the app running without asking you anything

---

## Suggested build order

1. **SETUP** (all) → **DATA** (all) — nothing works without these
2. **PARSE-1 → PARSE-2/3** — prove you can turn a real CSV into transaction objects before building UI around it
3. **RULES-1 → RULES-2** — matching logic, unit-tested in isolation
4. **UPLOAD-1 → UPLOAD-6** — the upload/review/commit flow end to end (this is your biggest single feature)
5. **ACCOUNTS-1 → 3**, **CATEGORIES-1 → 2** — needed as prerequisites for upload/review UI to have real dropdown data
6. **DASH-1 → 2** — see your uploaded statements
7. **DETAIL-1 → 6** — the statement detail view, week bucketing last (most fiddly logic)
8. **TXN-1 → 2**, **RULESUI-1** — the remaining CRUD/edit surfaces
9. **PKG-1 → 4** — dockerize once the app actually works locally in dev mode

Note: PARSE-2/3 (specific bank parsers) need real sample CSVs to build against — you already have two from this conversation, which is a good starting point.
