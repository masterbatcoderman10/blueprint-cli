# Phase 5 — Milestone Integration, Verification & Cleanup Plan

**Status**: Planning
**Milestone**: Revision 6 — Built-in Task Tracker

---

## Goals

- Tasks carry an explicit `milestone` field; multi-milestone projects can group, query, and filter by it without parsing task IDs at runtime.
- `GET /tasks` accepts a `milestone` filter, AND-combined with existing `phase` and `stream` filters.
- The Board SPA exposes Milestone as a third independent filter dropdown alongside Phase and Stream; the header milestone count reflects real data instead of the defensive `|| 1` placeholder.
- Tracker schema bumps to version 2 with an idempotent v1 → v2 migration that backfills `milestone` from existing task IDs and normalizes legacy long-form `phase` values to their short form.
- Pre-Phase-5 JSON snapshots remain importable: Doctor's `importSnapshot` derives `milestone` from the task ID when missing.
- SRS requirement MAS-204 documents the new schema field (in-place update + change-log entry); MAS-204 and MAS-205 transition `approved-pending-implementation` → `active` at phase completion.
- Repository is free of `vibe-kanban` / `kanban MCP` references outside revision-history docs; full test suite green; release-readiness check passes.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 1 — Tracker Core (schema, CRUD server, `TRACKER_SCHEMA_VERSION`) | Complete |
| Phase 2 — Board SPA (`Filters.svelte`, `Header.svelte`, `lib/api.ts`) | Complete |
| Phase 3 — Protocol Rewrite (state machine, tracker contract docs) | Complete |
| Phase 4 — Migration & Doctor Integration (snapshot import path, schema-currency audit, `applySchema` invocation by Doctor repair plan) | Complete |
| SRS requirements MAS-204, MAS-205 (status `approved-pending-implementation`) | In SRS |

---

## Parallel-Safety Contract

Streams A and B must touch **fully disjoint files**. The Gate owns every file that would otherwise straddle a stream boundary, finishing its edits before A or B starts.

| File | Owner | Notes |
|------|-------|-------|
| `src/tracker/schema.ts` | Gate | Version bump + DDL only. |
| `src/tracker/migrations.ts` (NEW) | Gate | Parse + normalize helpers + v1→v2 runner. |
| `src/tracker/types.ts` | Gate | Adds `milestone` to `Task`, `TaskFilter`, `CreateTaskInput`, `UpdateTaskInput`. |
| `src/tracker/routes/tasks.ts` | Gate (row mapping) → Stream A (filter + validation) | Sequential: Gate finishes row-mapping change before Stream A extends handlers. Stream B never touches this file. |
| `src/tracker/export.ts` | Stream A | Snapshot import back-compat. |
| `src/tracker/spa/components/Filters.svelte` | Stream B | Milestone dropdown. |
| `src/tracker/spa/components/Header.svelte` | Stream B | Replace defensive `(t as Record<string, unknown>).milestone` read with explicit `t.milestone`. |
| `src/tracker/spa/lib/api.ts` | Stream B | Filter shape + `TaskData` extension. |
| `src/tracker/spa/stores/tasks.svelte.ts` | Stream B | Local filter state for milestone. |
| `docs/srs.md` | Gate (schema-detail update) → Stream C (status transitions) | Sequential: Gate updates MAS-204 schema text; Stream C transitions MAS-204 + MAS-205 status. |
| `docs/milestones/revision-6-built-in-tracker/revision-6-built-in-tracker.md` | Stream C | Phase 5 row amendment. |

Streams A and B share no files. Within a stream, tasks run sequentially per their `Dependencies` column.

---

## Gate R6-5.0 — Milestone Schema Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-5.0.1 | Update MAS-204 in `docs/srs.md` — add `milestone TEXT NOT NULL` to the documented tasks-table schema; add a change-log entry noting the phase-level schema-detail deepening per `phase-planning.md` permitted updates. Status stays `approved-pending-implementation`. | 0.5 | None | Independent |
| R6-5.0.2 | Bump `TRACKER_SCHEMA_VERSION` from `1` to `2` in `src/tracker/schema.ts`; extend the `tasks` `CREATE TABLE IF NOT EXISTS` DDL to include `milestone TEXT NOT NULL`; add index `idx_tasks_milestone ON tasks(milestone)`; add composite `idx_tasks_milestone_phase ON tasks(milestone, phase)` for filter performance. | 0.5 | None | Independent |
| R6-5.0.3 | Create `src/tracker/migrations.ts` with two pure helpers: `parseMilestoneFromId(id: string): string \| null` (regex `^([MR]\d+)-` — returns `'M1'`, `'R6'`, etc.) and `normalizePhase(phase: string): string` (collapses long-form `'Phase 4 — Migration & Doctor Integration'` to short-form `'R6-4'` using the task ID context; falls back to identity when already short-form). | 0.75 | None | Independent |
| R6-5.0.4 | Implement the v1 → v2 migration runner in `src/tracker/migrations.ts` and wire it into `applySchema(db)` in `src/tracker/schema.ts`. Runner reads `user_version`; if `1`, opens a single transaction that: (a) `ALTER TABLE tasks ADD COLUMN milestone TEXT` (no NOT NULL yet — backfill first), (b) iterates rows, computing `milestone = parseMilestoneFromId(id)` and a normalized `phase` via `normalizePhase(phase)`, (c) `UPDATE tasks SET milestone = ?, phase = ?`, (d) rejects with a clear error if any row produces `milestone = null` (signals an ID not matching `^[MR]\d+-` — points the user at manual fix), (e) recreates the table with `milestone NOT NULL` constraint via standard SQLite copy-rename, (f) sets `user_version = 2`. Migration is idempotent: re-running on a v2 DB is a no-op. | 1.5 | R6-5.0.2, R6-5.0.3 | Dependent |
| R6-5.0.5 | Update `src/tracker/types.ts`: add `milestone: string` to `Task`, `milestone?: string` to `TaskFilter`, `milestone: string` to `CreateTaskInput`, `milestone?: string` to `UpdateTaskInput`. Update row-mapping in `src/tracker/routes/tasks.ts` (the `rowToTask` shape near line 38) to read the new column. Do NOT touch the filter/validation handlers — those belong to Stream A. | 0.5 | R6-5.0.4 | Dependent |
| R6-5.0.6 | Add `tests/tracker/migrations.test.ts` covering: `parseMilestoneFromId` happy + edge cases (`'R6-3.A.1'` → `'R6'`, `'M1-2.0.1'` → `'M1'`, `'invalid'` → `null`); `normalizePhase` collapses the known long-form row; v1 → v2 migration backfills milestone + normalizes phase; idempotency on v2 DB; rollback on null-milestone row. | 1.0 | R6-5.0.4 | Dependent |
| R6-5.0.7 | Update `tests/tracker/schema.test.ts` to assert `TRACKER_SCHEMA_VERSION === 2`, the new column exists with the NOT NULL constraint, and both new indexes are present. | 0.5 | R6-5.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] `TRACKER_SCHEMA_VERSION === 2`.
- [ ] Fresh `applySchema()` on an empty DB produces a `tasks` table with `milestone TEXT NOT NULL` and both new indexes.
- [ ] Running `applySchema()` on the existing project's v1 DB (757 rows of task history in `docs/.blueprint/tasks.db`) backfills every row's `milestone` from the task ID, normalizes the one known long-form phase value, and bumps `user_version` to `2` in a single transaction.
- [ ] Re-running `applySchema()` on a v2 DB is a no-op (idempotent).
- [ ] `docs/srs.md` MAS-204 schema description lists `milestone` with a change-log entry referencing Phase 5.
- [ ] `Task`, `TaskFilter`, `CreateTaskInput`, `UpdateTaskInput` in `src/tracker/types.ts` include `milestone`.
- [ ] `rowToTask` in `src/tracker/routes/tasks.ts` returns `milestone` on every read; Stream A is the sole post-Gate editor of this file.
- [ ] Migration tests and schema tests pass; existing test suite remains green.

---

## Stream A — Server Filter, Validation & Snapshot Back-Compat

> Extends `GET /tasks` filter surface, validates `milestone` on writes, and keeps pre-P5 snapshots importable.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-5.A.1 | Extend `GET /tasks` in `src/tracker/routes/tasks.ts` to accept `?milestone=<value>` query param. AND-combine with `phase` and `stream` using the existing `where[]` + `values[]` pattern. Trim whitespace; reject empty strings with a clear 400. | 0.5 | Gate | Dependent |
| R6-5.A.2 | Add `milestone` validation to `POST /tasks` and `PATCH /tasks/:id` handlers in `src/tracker/routes/tasks.ts`. On POST: `milestone` is required (non-empty string), and on creation auto-derive via `parseMilestoneFromId(id)` when the body omits it and the ID matches the prefix pattern; reject 400 if absent and unparseable. On PATCH: optional; when present, validate non-empty string. | 0.75 | R6-5.A.1 | Dependent |
| R6-5.A.3 | Extend `importSnapshot` in `src/tracker/export.ts` so that a snapshot row missing `milestone` is filled via `parseMilestoneFromId(row.id)` before insertion. If both the snapshot field is missing AND the ID does not match the prefix pattern, surface the row id in a single aggregated error (do not silently drop). Also extend the snapshot writer to include `milestone` in the JSON shape. | 0.75 | Gate | Dependent |
| R6-5.A.4 | Add `tests/tracker/routes-tasks-milestone.test.ts` covering: `GET /tasks?milestone=R6` returns only R6 tasks; combined `?milestone=R6&phase=R6-3` AND-narrows correctly; empty `milestone=` rejected; `POST /tasks` without milestone auto-derives from ID; `POST /tasks` with explicit milestone wins over derivation; `POST /tasks` rejected when no milestone supplied and ID does not match prefix; `PATCH /tasks/:id` accepts milestone update. | 1.0 | R6-5.A.2 | Dependent |
| R6-5.A.5 | Add `tests/tracker/export-milestone.test.ts` covering: pre-P5 snapshot (no milestone field on rows) imports with milestone derived from IDs; snapshot with malformed IDs surfaces aggregated error and leaves the DB untouched; round-trip (export → import) preserves milestone on every row. | 1.0 | R6-5.A.3 | Dependent |
| R6-5.A.6 | Add `tests/tracker/export-milestone-atomicity.test.ts` — explicit partial-failure atomicity test. Construct a snapshot with 50 well-formed rows followed by 1 row with a malformed ID (`'orphan-task'`). Invoke `importSnapshot()` and assert: (a) transaction rolls back completely — DB row count is exactly 0 (no partial writes), (b) error message names the offending row's ID, (c) attempting the import again with a corrected snapshot succeeds (verifies DB is clean, not corrupted). | 1.25 | R6-5.A.3, R6-5.A.5 | Dependent |

### Stream A Acceptance Criteria

- [ ] `GET /tasks?milestone=R6` returns only tasks whose `milestone = 'R6'`.
- [ ] `GET /tasks?milestone=R6&phase=R6-3&stream=A` AND-combines all three filters.
- [ ] `POST /tasks` succeeds without an explicit `milestone` when the ID is well-formed (e.g., `'R6-5.A.1'` derives `'R6'`).
- [ ] `POST /tasks` returns 400 when `milestone` is omitted AND the ID does not match `^[MR]\d+-`.
- [ ] `PATCH /tasks/:id` accepts a `milestone` update with the same non-empty validation.
- [ ] `importSnapshot` accepts a pre-P5 snapshot and backfills `milestone` via ID parsing.
- [ ] Snapshot writer includes `milestone` on every row; export → import round-trip preserves the field.
- [ ] **Snapshot import is atomic: when 1 of 51 rows has a malformed ID, all 51 rows are NOT inserted (complete rollback) and error names the offending row.**
- [ ] All new tests pass; existing server tests remain green.

---

## Stream B — SPA Filter Dropdown & Header Count

> Adds Milestone as a third independent filter dropdown and replaces the defensive milestone-count read in the header.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-5.B.1 | Extend `src/tracker/spa/lib/api.ts`: add `milestone?: string` to the API filter shape used by `fetchTasks`; add `milestone?: string` to the `TaskData` interface (lines ~21–38). | 0.5 | Gate | Dependent |
| R6-5.B.2 | Extend `src/tracker/spa/stores/tasks.svelte.ts` filter state to include `milestone` alongside `phase` and `stream`; pass through to `fetchTasks`. | 0.5 | R6-5.B.1 | Dependent |
| R6-5.B.3 | Update `src/tracker/spa/components/Filters.svelte`: add a Milestone dropdown to the left of the existing Phase dropdown. Derive `milestones` via `Array.from(new Set(tasks.map((t) => t.milestone).filter(Boolean) as string[])).sort()`. Emit on change via `onFilterChange({ milestone, phase, stream })`. Match existing label + select styling exactly (font sizes, colors, spacing). | 1.0 | R6-5.B.2 | Dependent |
| R6-5.B.4 | Update `src/tracker/spa/components/Header.svelte`: replace the defensive cast at lines 44–46 with `const milestoneCount = $derived(new Set(tasks.map((t) => t.milestone).filter(Boolean)).size)`. Keep `data-testid="milestone-count"`. The `|| 1` fallback goes away. | 0.5 | R6-5.B.1 | Dependent |
| R6-5.B.5 | Extend `tests/spa/Filters.test.ts` to assert the Milestone dropdown renders, lists unique milestones from the task set sorted alphabetically, and emits `{ milestone, phase, stream }` on change. | 0.75 | R6-5.B.3 | Dependent |
| R6-5.B.6 | Extend `tests/spa/Header.test.ts` to assert `[data-testid="milestone-count"]` renders the real count (e.g., 1 when all tasks are `R6`, 2 when mixed `M1` + `R6`). Drop the test (if any) that pinned the count to `1`. | 0.5 | R6-5.B.4 | Dependent |
| R6-5.B.7 | Add end-to-end test `tests/e2e/doctor-snapshot-import.test.ts` — Doctor integration validation. Create a temporary project, generate a pre-P5 `tasks.export.json` snapshot (manually or via fixture), invoke Doctor's repair plan (which calls `importSnapshot`), verify the DB has all tasks with milestone backfilled, then start `blueprint board --headless` and fetch `GET /tasks?milestone=R6`, assert response is `{ ok: true, data: [...] }` with all tasks carrying `milestone` field. Confirms Doctor → snapshot import → board rendering integration. | 1.5 | R6-5.A.6, R6-5.B.6 | Dependent |

### Stream B Acceptance Criteria

- [ ] Milestone ▾ dropdown renders in the filter row to the left of Phase ▾ and Stream ▾.
- [ ] Selecting a milestone narrows the board to tasks in that milestone; AND-combines with Phase and Stream.
- [ ] Clearing the Milestone selection (empty option) restores the unfiltered view.
- [ ] Header milestone-count badge reflects the unique-milestone count of the current task set (no `|| 1` fallback).
- [ ] No SPA file touched by Stream B is also touched by Stream A (verified by the Parallel-Safety Contract).
- [ ] **Doctor → snapshot import → board rendering integration works end-to-end: pre-P5 snapshot imports with milestone backfilled; board renders filtered by milestone; HTTP responses are correct envelope.**
- [ ] All new and existing SPA tests pass.

---

## Stream C — Verification, SRS Activation & Release

> Final sweep, SRS transition, and revision-doc reconciliation. Depends on A + B because the rg sweep, test run, and release check must run against the integrated state.
> **Depends on:** Stream A (server tests must be green) and Stream B (SPA tests must be green).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-5.C.1 | Run `rg -i 'vibe-kanban\|kanban mcp' docs/ templates/ src/ tests/`. Triage every hit. Allowed: revision-history docs (`docs/milestones/revision-6-built-in-tracker/**`) and the `decisions` log in `docs/project-progress.md`. Anything else is a Phase-5 fix. Document the surviving allow-listed hits in the phase completion notes. | 0.5 | A.5, B.6 | Dependent |
| R6-5.C.2 | Run `npm test` against the full suite. Assert green. Capture the test-count delta (Phase 4 baseline = 805 tests, 120 files) and record the new totals in the phase-completion entry. | 0.25 | A.5, B.6 | Dependent |
| R6-5.C.3 | Transition `docs/srs.md`: MAS-204 status `approved-pending-implementation` → `active`; MAS-205 status `approved-pending-implementation` → `active`. Add change-log entries on both referencing Phase 5 completion. | 0.5 | R6-5.C.2 | Dependent |
| R6-5.C.4 | Run release-readiness check per `docs/conventions.md` release flow: `npm run release:check`. Confirm CI and Publish workflows would succeed (do not actually publish in this phase). | 0.5 | R6-5.C.3 | Dependent |
| R6-5.C.5 | Amend `docs/milestones/revision-6-built-in-tracker/revision-6-built-in-tracker.md` Phase 5 row to reflect the expanded scope (milestone integration + verification). Update Success Criteria to include the milestone field, filter, and snapshot back-compat. Add a Deferred Items entry noting any items moved out (none expected). | 0.5 | R6-5.C.1 | Dependent |
| R6-5.C.6 | Add `tests/tracker/schema-integrity.test.ts` — post-migration schema validation. On the live project DB (`docs/.blueprint/tasks.db`), after opening via `openDb()`, execute: (a) `PRAGMA integrity_check` — must return `'ok'`, (b) `PRAGMA foreign_key_check` — must return zero rows (no orphans), (c) verify `TRACKER_SCHEMA_VERSION === 2`, (d) verify every row in `tasks` table has `milestone IS NOT NULL`, (e) verify indexes `idx_tasks_milestone` and `idx_tasks_milestone_phase` exist and are properly formed. | 0.75 | R6-5.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] `rg -i 'vibe-kanban\|kanban mcp' docs/ templates/ src/ tests/` returns zero hits outside the revision-history allow-list.
- [ ] `npm test` is green; test totals recorded.
- [ ] MAS-204 and MAS-205 are `active` in `docs/srs.md` with Phase 5 change-log entries.
- [ ] **Live project DB (`docs/.blueprint/tasks.db`) passes integrity check: `PRAGMA integrity_check` returns `'ok'`, no foreign-key orphans, `TRACKER_SCHEMA_VERSION === 2`, every row has `milestone IS NOT NULL`, indexes are present and valid.**
- [ ] `npm run release:check` exits clean.
- [ ] Revision 6 document's Phase 5 row matches what was actually built.
- [ ] `docs/prd.md` is untouched (verified by `git diff docs/prd.md` → empty).

---

## Parallelization Map

```
Gate R6-5.0 (Milestone Schema Foundation) ──┐
   schema bump + migration + types + SRS    │
   text + row mapping                       │
                                             │
                 ┌──────────────────────────┤
                 │                           │
  Stream A ─────► server filter + write     │
                  validation + snapshot     │
                  back-compat               │
                                             │
  Stream B ─────► SPA filter dropdown +     │
                  header milestone count    │
                                             │
                 │                           │
                 └── Stream C (depends A+B) │
                     rg sweep + test run + ─►│
                     SRS active + release    │
                     check + revision-doc    │
                                             │
                                             ▼
                                  Phase 5 complete
                                  Revision 6 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate R6-5.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R6-5.0.1 | — | Not testable: SRS documentation edit. | — |
| T-R6-5.0.2.1 | R6-5.0.2 | unit | `TRACKER_SCHEMA_VERSION` constant equals `2`. | Import returns `2`. |
| T-R6-5.0.2.2 | R6-5.0.2 | integration | Fresh `applySchema()` on empty DB produces `tasks.milestone` column with `NOT NULL` constraint. | `PRAGMA table_info(tasks)` shows `milestone TEXT NOT NULL`. |
| T-R6-5.0.2.3 | R6-5.0.2 | integration | Fresh `applySchema()` creates `idx_tasks_milestone` and `idx_tasks_milestone_phase`. | `PRAGMA index_list(tasks)` includes both. |
| T-R6-5.0.3.1 | R6-5.0.3 | unit | `parseMilestoneFromId` parses well-formed IDs. | `'R6-3.A.1'` → `'R6'`; `'M1-2.0.1'` → `'M1'`. |
| T-R6-5.0.3.2 | R6-5.0.3 | unit | `parseMilestoneFromId` returns `null` for malformed IDs. | `'orphan-task'`, `''`, `'foo-1.A.1'` → `null`. |
| T-R6-5.0.3.3 | R6-5.0.3 | unit | `normalizePhase` collapses known long-form value. | `'Phase 4 — Migration & Doctor Integration'` → `'R6-4'` when paired with an `R6-4.*` ID. |
| T-R6-5.0.3.4 | R6-5.0.3 | unit | `normalizePhase` is identity on short-form. | `'R6-4'` → `'R6-4'`. |
| T-R6-5.0.4.1 | R6-5.0.4 | integration | v1→v2 migration backfills `milestone` on every row from ID prefix. | After migration, no row has `milestone IS NULL`. |
| T-R6-5.0.4.2 | R6-5.0.4 | integration | v1→v2 migration normalizes the legacy long-form phase row alongside the milestone backfill. | Row's `phase` becomes `'R6-4'` and `milestone` becomes `'R6'`. |
| T-R6-5.0.4.3 | R6-5.0.4 | integration | Migration is idempotent on a v2 DB. | Second `applySchema` call is a no-op; `user_version` stays at `2`; no row mutation. |
| T-R6-5.0.4.4 | R6-5.0.4 | integration | Migration aborts atomically when a row's ID cannot be parsed. | Transaction rolls back; `user_version` stays at `1`; error names the offending ID(s). |
| T-R6-5.0.5 | R6-5.0.5 | integration | `GET /tasks` payload includes the `milestone` field on every row. | Every task row in the response has a non-empty `milestone`. |
| **T-R6-5.0.5.HTTP** | **R6-5.0.5** | **integration** | **HTTP envelope contract: `GET /tasks` returns `{ ok: true, data: [...] }`**. | **Response body has `ok: true` and `data` is an array; no bare `{ data }` shape**. |
| — | R6-5.0.6 | — | Not testable: this task authors the migration tests covering R6-5.0.3 and R6-5.0.4. | — |
| — | R6-5.0.7 | — | Not testable: this task updates the schema tests covering R6-5.0.2. | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-5.A.1.1 | R6-5.A.1 | integration | `GET /tasks?milestone=R6` returns only `R6` tasks. | Response contains zero non-`R6` rows. |
| T-R6-5.A.1.2 | R6-5.A.1 | integration | `GET /tasks?milestone=R6&phase=R6-3&stream=A` AND-combines all three filters. | Response contains only `R6-3.A.*` tasks. |
| T-R6-5.A.1.3 | R6-5.A.1 | integration | `GET /tasks?milestone=` (empty value) returns 400. | Status `400`; error body names the bad param. |
| **T-R6-5.A.1.HTTP** | **R6-5.A.1** | **integration** | **HTTP envelope contract: `GET /tasks?milestone=R6` returns `{ ok: true, data: [...] }` and error at `?milestone=` returns `{ ok: false, error: { code, message } }`**. | **Success response has `ok: true` field; error response has `ok: false` field. No bare envelope shape**. |
| T-R6-5.A.2.1 | R6-5.A.2 | integration | `POST /tasks` body without `milestone` auto-derives from a well-formed ID. | `'R6-5.A.1'` body → row stored with `milestone='R6'`. |
| T-R6-5.A.2.2 | R6-5.A.2 | integration | Explicit `milestone` in `POST /tasks` body wins over ID-derived value. | Body `{ id: 'R6-5.A.1', milestone: 'M1' }` → row stored with `milestone='M1'`. |
| T-R6-5.A.2.3 | R6-5.A.2 | integration | `POST /tasks` rejected when `milestone` absent AND ID unparseable. | Status `400`; row not created. |
| **T-R6-5.A.2.HTTP** | **R6-5.A.2** | **integration** | **HTTP envelope contract: `POST /tasks` success returns `{ ok: true, data: Task }` and validation error returns `{ ok: false, error: { code, message } }`**. | **Success response wraps new task in `ok: true, data` envelope; error response has `ok: false` with error details**. |
| T-R6-5.A.2.4 | R6-5.A.2 | integration | `PATCH /tasks/:id` accepts a `milestone` update. | Subsequent `GET` shows the new value; empty string still rejected. |
| T-R6-5.A.3.1 | R6-5.A.3 | integration | `importSnapshot` derives `milestone` from ID when missing on the row. | Pre-P5 snapshot imports cleanly; every row has `milestone` set. |
| T-R6-5.A.3.2 | R6-5.A.3 | integration | `importSnapshot` aborts atomically on a malformed-ID row and surfaces an aggregated error. | DB row count unchanged; error message names the offending ID(s). |
| T-R6-5.A.3.3 | R6-5.A.3 | integration | Snapshot writer includes `milestone`; export → import round-trip preserves the field. | Re-imported rows match original rows exactly. |
| **T-R6-5.A.3.HTTP** | **R6-5.A.3** | **integration** | **HTTP envelope contract: snapshot export JSON has `{ tasks: [...], comments: [...], meta: {...} }` shape (no `ok` field on snapshots, as they are internal)**. | **Snapshot JSON parses correctly and round-trip import produces identical task data**. |
| **T-R6-5.A.6.1** | **R6-5.A.6** | **integration** | **Snapshot import atomicity: 51-row snapshot with row 51 malformed → all 51 rows rejected, DB row count = 0.** | **Zero rows inserted; transaction rolled back completely; no partial write.** |
| **T-R6-5.A.6.2** | **R6-5.A.6** | **integration** | **Snapshot import error message names the offending row ID.** | **Error message names row 51's malformed ID (e.g., `'orphan-task'`); user can correct and retry.** |
| **T-R6-5.A.6.3** | **R6-5.A.6** | **integration** | **After failed import, DB is clean and can accept a corrected snapshot.** | **Corrected 50-row snapshot imports successfully; verifies DB not corrupted by failed attempt.** |
| — | R6-5.A.4 | — | Not testable: this task authors the server filter + validation tests. | — |
| — | R6-5.A.5 | — | Not testable: this task authors the snapshot back-compat tests. | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-5.B.1 | R6-5.B.1 | unit | `fetchTasks` appends `?milestone=` to URL when filter supplied. | Captured fetch URL includes `milestone=R6` and `phase=` / `stream=` when set. |
| **T-R6-5.B.1.HTTP** | **R6-5.B.1** | **unit** | **Client-side HTTP envelope handling: `fetchTasks` response `{ ok: true, data: [...] }` is extracted correctly; `{ ok: false, error }` is rejected**. | **`listTasks` returns `Result` type; client correctly uses `response.ok` and `response.data` fields**. |
| T-R6-5.B.2 | R6-5.B.2 | unit | Store filter state holds `milestone` alongside `phase` and `stream` and passes it through. | Setting `milestone` triggers a `fetchTasks` call with the new value. |
| T-R6-5.B.3.1 | R6-5.B.3 | integration | `Filters.svelte` renders a Milestone dropdown positioned left of the Phase dropdown. | DOM order: Milestone, Phase, Stream. |
| T-R6-5.B.3.2 | R6-5.B.3 | integration | Milestone dropdown lists unique milestones from the task set, alphabetically sorted. | Options match `[...new Set(tasks.map(t => t.milestone))].sort()`. |
| T-R6-5.B.3.3 | R6-5.B.3 | integration | Milestone change emits `{ milestone, phase, stream }` to `onFilterChange`. | Callback receives the full filter triple. |
| T-R6-5.B.4.1 | R6-5.B.4 | integration | `Header.svelte` `[data-testid="milestone-count"]` renders the real unique-milestone count. | All-`R6` set renders `1`. |
| T-R6-5.B.4.2 | R6-5.B.4 | integration | Mixed-milestone task set produces the correct count. | Set with `M1` + `R6` tasks renders `2`. |
| **T-R6-5.B.7** | **R6-5.B.7** | **e2e** | **Doctor → snapshot import → board rendering integration: pre-P5 snapshot imports with milestone backfilled; board starts successfully; `GET /tasks?milestone=R6` returns `{ ok: true, data: [...] }` with all tasks carrying `milestone` field.** | **End-to-end flow works; no HTTP envelope errors; board renders correctly after Doctor import.** |
| — | R6-5.B.5 | — | Not testable: this task authors the Filters.svelte tests. | — |
| — | R6-5.B.6 | — | Not testable: this task authors the Header.svelte tests. | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-5.C.1 | R6-5.C.1 | integration | Suite-level meta-test runs `rg -i 'vibe-kanban\|kanban mcp' docs/ templates/ src/ tests/` and asserts zero hits outside the allow-list. | Allow-list = `docs/milestones/revision-6-built-in-tracker/**` + `docs/project-progress.md` Decisions log. Test fails on any other hit. |
| — | R6-5.C.2 | — | Not testable: this task is the act of running the test suite. | — |
| T-R6-5.C.3 | R6-5.C.3 | unit | Doc-assertion test asserts MAS-204 and MAS-205 status lines read `active` in `docs/srs.md`. | Both requirement blocks contain `status: active`. |
| **T-R6-5.C.6.1** | **R6-5.C.6** | **integration** | **Live project DB schema integrity: `PRAGMA integrity_check` returns `'ok'` and `PRAGMA foreign_key_check` returns zero rows.** | **DB has no corruption and no orphaned foreign keys.** |
| **T-R6-5.C.6.2** | **R6-5.C.6** | **integration** | **Post-migration schema version and constraints: `TRACKER_SCHEMA_VERSION === 2`, every row in `tasks` has `milestone IS NOT NULL`.** | **Schema version is correct; no null milestones exist.** |
| **T-R6-5.C.6.3** | **R6-5.C.6** | **integration** | **Post-migration indexes exist and are valid: `idx_tasks_milestone` and `idx_tasks_milestone_phase` are present and properly formed.** | **Indexes exist on correct columns with correct types (TEXT, TEXT).** |
| — | R6-5.C.4 | — | Not testable: `npm run release:check` is an external release-readiness command, not part of the standard suite. | — |
| — | R6-5.C.5 | — | Not testable: revision document amendment is a documentation edit. | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R6-5.0 | 7 | 5 | 2 |
| Stream A | **6** | **4** | **2** |
| Stream B | **7** | **5** | **2** |
| Stream C | **6** | **4** | **2** |
| **Total** | **26** | **18** | **8** |

Total tests: **40** (Gate 12 + Stream A 13 [includes 3 atomicity tests from R6-5.A.6] + Stream B 8 [includes 1 E2E test from R6-5.B.7] + Stream C 7 [includes 3 schema integrity tests from R6-5.C.6]). The atomicity and schema-integrity tests are critical for data integrity and correctness validation post-migration.

---

## Definition of Done

- [ ] Gate R6-5.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] No lint errors in files touched by this phase.
- [ ] `TRACKER_SCHEMA_VERSION === 2` and the live `docs/.blueprint/tasks.db` has migrated successfully (every row carries a non-null milestone).
- [ ] Streams A and B touch disjoint files (verified by the Parallel-Safety Contract section).
- [ ] Full test suite green; counts recorded in `docs/project-progress.md` Decisions log.
- [ ] MAS-204 + MAS-205 transitioned to `active`.
- [ ] Revision 6 document Phase 5 row matches built scope.
- [ ] `docs/prd.md` unchanged.

---

## HTTP Response Envelope Contract

**CRITICAL: This section defines the exact shape of all HTTP responses. Violations cause client-side failures (e.g., `.map() is not a function` when the client receives `{ data: [...] }` instead of `{ ok: true, data: [...] }`). Every handler must validate this contract.**

### Success Response Format

All successful HTTP responses (`2xx` status) MUST use the envelope:

```json
{
  "ok": true,
  "data": <T>
}
```

- **`ok: true`** — Boolean literal, always present on success.
- **`data: <T>`** — The typed response payload (Task, Task[], ProjectMeta, etc.). Type varies by endpoint.

Examples:
- `GET /tasks` → `{ ok: true, data: [ { id: 'R6-5.A.1', milestone: 'R6', ... }, ... ] }`
- `POST /tasks` → `{ ok: true, data: { id: 'R6-5.A.1', milestone: 'R6', ... } }`
- `GET /project` → `{ ok: true, data: { name: '...', phaseCount: null, ... } }`

### Error Response Format

All error HTTP responses (`4xx` / `5xx` status) MUST use the envelope:

```json
{
  "ok": false,
  "error": {
    "code": "<error_code>",
    "message": "<human_readable_message>"
  }
}
```

- **`ok: false`** — Boolean literal, always present on error.
- **`error.code`** — Machine-readable error identifier (e.g., `'task_not_found'`, `'invalid_state'`, `'duplicate_id'`). Used for programmatic handling.
- **`error.message`** — Human-readable message describing the error. May include context (e.g., field names, rejected values).

Examples:
- `GET /tasks?milestone=` → `{ ok: false, error: { code: 'invalid_milestone', message: 'Milestone filter cannot be empty.' } }`
- `POST /tasks` (missing milestone + unparseable ID) → `{ ok: false, error: { code: 'invalid_milestone', message: 'Milestone required or auto-derivable from task ID. Received ID 'orphan-task' does not match ^[MR]\\d+-.' } }`
- `GET /tasks/missing-id` → `{ ok: false, error: { code: 'task_not_found', message: 'Task 'missing-id' was not found.' } }`

### Snapshot Export Format (Exception)

Snapshots exported to `docs/.blueprint/tasks.export.json` are internal files and do NOT use the HTTP envelope. They use a flat shape:

```json
{
  "tasks": [ { id, title, ... }, ... ],
  "comments": [ { id, task_id, ... }, ... ],
  "meta": { name, tagline, ... }
}
```

The snapshot has no `ok` field because it is consumed directly by Doctor, not via HTTP.

### Validation Rules for Implementers

1. **Every HTTP handler MUST wrap its response via `dataResult(status, data)` (success) or `errorResult(code, message)` (error).**
   - These functions ensure the envelope is applied consistently.
   - Do NOT construct envelope objects manually; use the helper functions.

2. **Every test MUST validate the full envelope, not just the `data` field.**
   - ❌ BAD: `expect(response.body).toHaveProperty('data')`
   - ✅ GOOD: `expect(response.body).toEqual({ ok: true, data: {...} })`
   - ✅ GOOD: `expect(response.body).toMatchObject({ ok: true, data: {...} })`

3. **Client-side code (`src/tracker/spa/lib/api.ts`) MUST check `response.ok` and handle both success and error cases.**
   - Do NOT assume success or bare `{ data }` responses.
   - Properly extract `response.data` on `response.ok === true` and `response.error` on `response.ok === false`.

4. **E2E and integration tests MUST verify that responses match the expected envelope on both happy path and error cases.**
   - Test at least one success endpoint (e.g., `GET /tasks`, `POST /tasks`) and one error case (e.g., empty filter, bad ID).

---

## Test Scenarios

### Happy Path

- [ ] Fresh `blueprint init` on a new project produces a v2 schema; first `POST /tasks` with ID `'M1-1.0.1'` auto-derives `milestone='M1'` and returns `{ ok: true, data: Task }`.
- [ ] Existing project DB (v1) is opened by `blueprint board`; migration backfills milestone on every historical task; board renders the milestone count as `1` (all `R6`).
- [ ] User opens the board, picks `R6` in Milestone ▾, then `R6-4` in Phase ▾, then `A` in Stream ▾ — board narrows to only `R6-4.A.*` tasks; all HTTP responses use correct envelope.
- [ ] Doctor encounters a missing DB, finds a pre-P5 `tasks.export.json`, and imports it — milestone backfilled from IDs; project state restored; final `GET /tasks` returns `{ ok: true, data: [...] }`.

### Edge Cases

- [ ] Snapshot import with one row whose ID is malformed (e.g., `'orphan-task'`) aborts atomically with `{ ok: false, error: { code: '...', message: '...' } }` naming the offending ID; DB remains untouched.
- [ ] `POST /tasks` body omits `milestone` and supplies an ID that does not match `^[MR]\d+-` → status 400, returns `{ ok: false, error: {...} }` with a clear message.
- [ ] `GET /tasks?milestone=` (empty value) → status 400, returns `{ ok: false, error: {...} }` (no silent unfiltered fallback).
- [ ] v1 → v2 migration encounters the legacy long-form phase row (`'Phase 4 — Migration & Doctor Integration'`) and normalizes it to `'R6-4'` while backfilling `milestone='R6'`; subsequent `GET /tasks` returns `{ ok: true, data: [...] }` with correct values.
- [ ] Re-opening a v2 DB does not re-run the migration (idempotency); `GET /tasks` continues to return correct envelope.
- [ ] SPA filter row: clearing the Milestone selection while Phase and Stream remain selected leaves the latter two active and broadens the milestone scope only; all intermediate fetches use correct envelope.

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R6-5.TW1), lists affected tasks, and
> includes test impact. See docs/core/tweak-planning.md for the full
> tweak workflow.

_None._

---
