# Phase 4 — Migration & Doctor Integration Plan

**Status**: Planning
**Milestone**: Revision 6 — Built-in Task Tracker

---

## Goals

- `blueprint doctor` detects pre-R6 projects (absence of `docs/.blueprint/tasks.db`) and offers a single composite repair that provisions the tracker, optionally imports an existing JSON snapshot, seeds project metadata, and injects the canonical `.gitignore` entry.
- A bidirectional JSON snapshot (`docs/.blueprint/tasks.export.json`) is written by the tracker server on every successful mutation and consumed by Doctor when rebuilding a DB on a fresh clone.
- `blueprint doctor` validates schema currency (`PRAGMA user_version` vs bundled `TRACKER_SCHEMA_VERSION`) and DB integrity (`PRAGMA integrity_check`) on existing tracker projects, using a **read-only** open so the audit never silently upgrades a stale DB before the finding is emitted.
- The composite migration is idempotent: a second Doctor run on a freshly migrated project yields a clean report.
- Repository-wide `vibe-kanban` / `kanban MCP` references remain at zero outside R6 revision history.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 1 — Tracker Core (schema, `openDb`, `applySchema`, CRUD server, `project_meta` table) | Complete |
| Phase 2 — Board SPA + `blueprint board` command (server entry points to hook export writes) | Complete |
| Phase 3 — Protocol Rewrite (core docs + templates rewritten; `**Tracker**:` field in `templates/docs/project-progress.md`) | Complete |
| Existing Doctor audit/repair/executor pipeline (`src/doctor/{audit,findings,repair,executor}.ts`) | Complete |

---

## Pre-Phase State (carry-over from prior phases)

The following infrastructure is already in place; Phase 4 reuses it without re-introducing it.

| Concern | Existing surface | Implication for Phase 4 |
|---------|------------------|-------------------------|
| Schema version constant | `TRACKER_SCHEMA_VERSION = 1` is exported from `src/tracker/schema.ts` (Phase 1). | Phase 4 reuses this constant unchanged. **Do not introduce a new name.** |
| Version write on migration | `applySchema(db)` already writes `PRAGMA user_version = TRACKER_SCHEMA_VERSION` at the end of the migration (Phase 1). | Phase 4 does not need to add a version-write step; `applySchema` is the canonical version-stamping path. |
| DB open + auto-migration | `openDb(projectRoot)` calls `applySchema` on every open (Phase 1, `src/tracker/db.ts:24`). | Drift detection MUST NOT use `openDb` — it would auto-migrate and erase the stale signal before the audit reads it. Stream C opens the DB read-only via raw `better-sqlite3` for inspection. |
| Current dev DB version | The existing `docs/.blueprint/tasks.db` in this repo is already at `user_version = 1`. | No transitional fix-up needed for current dev DBs after Phase 4 ships. Schema-stale drift can only fire if (a) `TRACKER_SCHEMA_VERSION` is bumped in a future phase against an older DB, or (b) someone hand-edited a DB downward. |
| `project_meta` write in `init.ts` | `init.ts` already runs an inline `INSERT OR REPLACE INTO project_meta` after scaffold (Phase 1, `src/commands/init.ts:21–27`). | Gate R6-4.0.3 extracts this inline logic into a shared helper without changing init behavior. The same helper is reused by Stream B's migration repair. |
| Server entry surface | All mutating routes (`/tasks`, `/tasks/:id`, `/tasks/:id/comments`, `/tasks/:id/comments/:cid`) exist in `src/tracker/server.ts` (Phase 1 + 2). | Stream A only adds a post-commit hook; no route changes. |

---

## SRS Slice

- **MAS-204 — Built-in Task Tracker.** This phase deepens MAS-204 with a bidirectional JSON snapshot sub-detail (server-side hook on every mutation; Doctor import path on missing DB). Phase-level SRS update appends a change-log entry; meaning unchanged.
- **MAS-205 — Local Project Board UI.** No SPA surface change in this phase. Server-side export hook lives behind the existing CRUD endpoints; SPA is not aware of it.

---

## Gate R6-4.0 — Migration Foundation

> Foundation helpers shared across streams: new finding types, JSON serializer/deserializer, `project_meta` seeder extraction, `.gitignore` injector, schema/integrity helpers on `db.ts`.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-4.0.1 | Add `MissingTrackerDbFinding` (kind `missing-tracker-db`, repairable) and `TrackerDbDriftFinding` (kind `tracker-db-drift`; `cause: 'schema-stale' \| 'integrity-fail'`; repairable only when cause is `schema-stale`) to `src/doctor/findings.ts` with factory functions. Extend `DoctorFinding` union; update existing render paths to recognize the new kinds with placeholder messages. | 0.5 | None | Independent |
| R6-4.0.2 | Create `src/tracker/export.ts` — `serializeSnapshot(db) → { tasks, comments, meta }` over flat shape (all `tasks` rows, all `review_comments` rows, the `project_meta` singleton). `importSnapshot(db, snapshot)` repopulates tables from a snapshot under a single transaction (clear existing, insert from snapshot). `writeSnapshotAtomic(projectRoot, snapshot)` writes to a temp file and renames into place at `docs/.blueprint/tasks.export.json`. `readSnapshot(projectRoot)` reads + validates shape. | 1.0 | None | Independent |
| R6-4.0.3 | Extract the `project_meta` seed logic currently inline in `src/commands/init.ts` (lines 17–30) into `src/tracker/project-meta.ts` as `seedProjectMeta(db, { name, tagline })`. Add a sibling `parseProjectMetaFromProgress(projectRoot) → { name, tagline }` that reads `docs/project-progress.md` for the project name + tagline fields. Refactor `init.ts` to call the extracted helpers. No behavior change in `init`. | 0.75 | None | Independent |
| R6-4.0.4 | Add `src/doctor/gitignore.ts` — `ensureTrackerDbIgnored(projectRoot)`. Idempotent: creates `.gitignore` at project root if missing; appends `docs/.blueprint/tasks.db` under a `# Blueprint` section header if the line is not already present. Returns whether the file was modified. | 0.5 | None | Independent |
| R6-4.0.5 | Extend `src/tracker/db.ts` with three helpers: (a) `getUserVersion(db) → number` reads `PRAGMA user_version`; (b) `runIntegrityCheck(db) → 'ok' \| string[]` returns `'ok'` or the list of issues from `PRAGMA integrity_check`; (c) `openDbReadOnly(projectRoot) → TrackerDbHandle` opens the existing DB with `{ readonly: true, fileMustExist: true }` and **does NOT call `applySchema`** so the audit can read the on-disk `user_version` without auto-migrating. Reuse the existing `TRACKER_SCHEMA_VERSION` constant from `src/tracker/schema.ts` — do NOT introduce a new constant. (Phase 1 already writes the version inside `applySchema`; no change there.) | 0.5 | None | Independent |

### Gate Acceptance Criteria

- [ ] `MissingTrackerDbFinding` and `TrackerDbDriftFinding` types are exported from `src/doctor/findings.ts` with factory functions; the `DoctorFinding` union accepts them.
- [ ] `src/tracker/export.ts` exposes `serializeSnapshot`, `importSnapshot`, `writeSnapshotAtomic`, and `readSnapshot` over the flat `{ tasks, comments, meta }` shape.
- [ ] `seedProjectMeta` and `parseProjectMetaFromProgress` are callable from both `init.ts` and Doctor; inline meta-seed logic in `init.ts` is removed.
- [ ] `ensureTrackerDbIgnored` injects the canonical ignore line idempotently; creates `.gitignore` when absent.
- [ ] `getUserVersion`, `runIntegrityCheck`, and `openDbReadOnly` are exported and unit-tested. `openDbReadOnly` does not call `applySchema` (verified by opening a fixture DB with `user_version = 0` and asserting it stays at `0` after the read-only handle closes).
- [ ] Phase 4 reuses the existing `TRACKER_SCHEMA_VERSION` constant from `src/tracker/schema.ts`; no new schema-version constant is introduced.

---

## Stream A — Server-side Export Hook

> Wires the snapshot serializer into the tracker server so every successful mutation refreshes `tasks.export.json`.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-4.A.1 | In `src/tracker/server.ts`, add a post-mutation hook invoked after each successful `POST` / `PATCH` / `DELETE` on `/tasks`, `/tasks/:id`, `/tasks/:id/comments`, and `/tasks/:id/comments/:cid`. Hook calls `writeSnapshotAtomic(projectRoot, serializeSnapshot(db))`. Best-effort: failures are caught, logged with a `[tracker] snapshot write failed` warning, and never block the HTTP response. | 1.0 | Gate | Dependent |
| R6-4.A.2 | Enforce ordering: snapshot write occurs **after** the DB transaction commits and **before** the HTTP response is flushed, so a client observing `200 OK` can safely assume `tasks.export.json` reflects the new state on disk (modulo the documented best-effort fallback). Document this contract as an inline comment near the hook. | 0.5 | R6-4.A.1 | Dependent |
| R6-4.A.3 | Add `tests/tracker/export-hook.test.ts` — contract tests covering each mutating endpoint: create task, update task, delete task, create comment, update comment, delete comment (asserting reply cascade reflected in JSON). Assert `tasks.export.json` parses, reflects post-mutation DB state, and matches `serializeSnapshot(db)` byte-for-byte. | 1.0 | R6-4.A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] Every mutating CRUD endpoint (`POST/PATCH/DELETE` on tasks and comments) writes `docs/.blueprint/tasks.export.json` reflecting the post-mutation DB state.
- [ ] Snapshot write occurs after DB commit and before HTTP response flush; ordering is documented in `server.ts`.
- [ ] Snapshot writes are atomic (temp + rename); concurrent writes produce a valid JSON file at all times.
- [ ] Snapshot write failures log a warning but never fail the HTTP response.
- [ ] Comment-delete cascades (parent → replies) are reflected in the JSON.

---

## Stream B — Pre-R6 Migration via Doctor

> Detects the absence of `docs/.blueprint/tasks.db` and runs a composite repair that provisions the DB, imports from JSON if present, seeds `project_meta`, and injects the `.gitignore` line.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-4.B.1 | Add `auditTrackerDb(projectDir)` to `src/doctor/audit.ts`. Detects absence of `docs/.blueprint/tasks.db` and emits a single `MissingTrackerDbFinding`. Wire into `runDoctorAudit` ahead of existing template-integrity checks. | 0.5 | Gate | Dependent |
| R6-4.B.2 | Add a `migrate-tracker-db` repair action to `src/doctor/repair.ts` + `executor.ts`. The action runs four steps in order under a single confirmation: (1) `openDb(projectRoot)` to create + migrate schema to current `SCHEMA_USER_VERSION`; (2) if `docs/.blueprint/tasks.export.json` exists, call `readSnapshot` + `importSnapshot` (skip on parse failure with a logged warning, do not abort); (3) call `seedProjectMeta` using `parseProjectMetaFromProgress(projectRoot)` — skip silently if the import already populated `project_meta`; (4) call `ensureTrackerDbIgnored(projectRoot)`. Action returns a structured result enumerating which sub-steps ran. | 1.5 | R6-4.B.1 | Dependent |
| R6-4.B.3 | Update `renderRepairPlan` (`src/doctor/repair.ts`) and `renderRepairResult` (`src/doctor/executor.ts`) to render the composite action as a numbered sub-step list under one heading. Each sub-step shows its own status (`will-run` / `applied` / `skipped (already current)` / `skipped (no snapshot)`). | 0.5 | R6-4.B.2 | Dependent |
| R6-4.B.4 | Add `tests/doctor/migration.test.ts` — integration test on a fixture project with no `docs/.blueprint/tasks.db`. Covers: (a) bare fixture (no snapshot, no .gitignore) → DB created, project_meta seeded, .gitignore created with line; (b) fixture with `tasks.export.json` → import populates DB, project_meta seed is skipped; (c) fixture with existing `.gitignore` lacking the line → line appended once; (d) second consecutive run yields clean report (idempotent). | 1.0 | R6-4.B.3 | Dependent |

### Stream B Acceptance Criteria

- [ ] Doctor detects pre-R6 projects via `tasks.db` absence and emits exactly one `MissingTrackerDbFinding`.
- [ ] The composite repair runs all four sub-steps in order under a single confirmation; idempotent on re-run.
- [ ] When `tasks.export.json` is present and valid, `importSnapshot` populates the DB; `seedProjectMeta` is skipped because `project_meta` is already populated by the import.
- [ ] When the snapshot is missing or malformed, the action falls through to `seedProjectMeta` from `project-progress.md` without aborting.
- [ ] `.gitignore` contains `docs/.blueprint/tasks.db` after repair; file is created if it did not exist.
- [ ] Repair plan and repair result renders show the four sub-steps as a numbered list under one finding.

---

## Stream C — Doctor Schema & Integrity Check

> Validates schema currency (`PRAGMA user_version`) and DB integrity (`PRAGMA integrity_check`) on existing tracker projects; routes schema-stale to an idempotent migration and integrity-fail to a non-repairable diagnostic.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-4.C.1 | Add `auditTrackerSchema(projectDir)` to `src/doctor/audit.ts`. Skips when `tasks.db` is absent (Stream B handles that). When DB is present: open via `openDbReadOnly` (NOT `openDb` — `openDb` would call `applySchema` and silently auto-migrate, masking the stale signal). If `getUserVersion(db) !== TRACKER_SCHEMA_VERSION` → emit `TrackerDbDriftFinding({ cause: 'schema-stale', observedVersion, expectedVersion: TRACKER_SCHEMA_VERSION })`. If `runIntegrityCheck(db)` is not `'ok'` → emit `TrackerDbDriftFinding({ cause: 'integrity-fail', issues: [...] })`. Both checks run on the same read-only handle; both findings may be emitted on the same DB. Close the read-only handle before returning. | 0.75 | Gate | Dependent |
| R6-4.C.2 | Add `repair-tracker-db-drift` repair action. For cause `schema-stale`: call `openDb(projectRoot)` — this triggers `applySchema`, which is the canonical idempotent migration path and re-stamps `PRAGMA user_version = TRACKER_SCHEMA_VERSION`. For cause `integrity-fail`: `createRepairPlan` marks the finding as non-repairable, sets `hasBlockingFindings: true`, and populates `blockingReason` with the integrity-check issue list. Render the diagnostic in `renderRepairPlan` (issue list shown verbatim; user resolves manually). | 1.0 | R6-4.C.1 | Dependent |
| R6-4.C.3 | Add `tests/doctor/tracker-drift.test.ts`. Fixtures must construct stale state **without** going through `openDb` (which would auto-migrate and erase the drift). Build fixtures via raw `new BetterSqlite3(path)` + manual DDL + explicit `PRAGMA user_version = 0`, then close, then run the audit which opens read-only. Cases: (a) DB with `user_version = 0` → schema-stale finding (observedVersion 0, expectedVersion `TRACKER_SCHEMA_VERSION`); repair runs `openDb` → re-audit clean and `user_version === TRACKER_SCHEMA_VERSION`; (b) corrupted DB (truncated file or rows manually broken) — `runIntegrityCheck` reports failure → integrity-fail finding → Doctor blocks repair plan with diagnostic listing issues; (c) current DB at correct version with clean integrity → no drift findings. | 1.0 | R6-4.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] `auditTrackerSchema` opens the DB via `openDbReadOnly`; the on-disk `user_version` is never mutated by the audit itself.
- [ ] `auditTrackerSchema` emits `TrackerDbDriftFinding({ cause: 'schema-stale' })` when `PRAGMA user_version !== TRACKER_SCHEMA_VERSION`; emits `TrackerDbDriftFinding({ cause: 'integrity-fail' })` when `PRAGMA integrity_check` is not `ok`; both may co-occur on the same DB.
- [ ] `repair-tracker-db-drift` repairs schema-stale by calling `openDb` (which invokes the existing idempotent `applySchema` migration and re-stamps `user_version`).
- [ ] Integrity-fail findings are non-repairable; Doctor halts the repair plan with a diagnostic listing the issues returned by `PRAGMA integrity_check`.
- [ ] `TRACKER_SCHEMA_VERSION` (already defined in Phase 1) remains the single source of truth; Phase 4 introduces no new schema-version constant.

---

## Stream D — Verification & Traceability

> Depends on Stream A (export hook), Stream B (migration), and Stream C (drift checks).
> End-to-end fixture coverage, idempotency, repository-wide `vibe-kanban` audit, and SRS/decision-log updates.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-4.D.1 | Add `tests/doctor/r6-migration-end-to-end.test.ts` — synthetic pre-R6 fixture exercising both new and existing Doctor paths together: no `tasks.db`, a legacy `**Kanban**:` field in `docs/project-progress.md` (drifted-file path), and a valid `tasks.export.json`. Assert Doctor emits both `MissingTrackerDbFinding` (composite repair) and the existing `DriftedFileFinding` (Kanban→Tracker rename via existing drift baseline). After repair: DB exists with imported rows, project-progress.md has the rewritten field, `.gitignore` has the line. | 1.0 | A.3, B.4, C.3 | Dependent |
| R6-4.D.2 | Idempotency test: re-run Doctor on the migrated fixture from D.1 and assert `auditResult.isClean === true`. Also assert a third run is still clean (no state drift from repeated invocations). | 0.5 | R6-4.D.1 | Dependent |
| R6-4.D.3 | Repository-wide audit step: run `rg -i 'vibe-kanban\|kanban mcp' docs/ templates/ src/ tests/`. Allowed hits: R6 revision documents (`docs/milestones/revision-6-built-in-tracker/**`), the `docs/project-progress.md` decisions log, and any superseded-history mention. Document the hit list inline in the phase's Tweaks section if any unexpected hit remains; otherwise note `zero non-historical hits`. | 0.5 | None | Independent |
| R6-4.D.4 | Update `docs/srs.md` for MAS-204: append a change-log entry under "### MAS-204" noting that R6 Phase 4 deepened the requirement with the bidirectional JSON snapshot sub-detail (server-side hook on every mutation; Doctor import path on missing DB). Meaning unchanged; ID unchanged. | 0.25 | None | Independent |
| R6-4.D.5 | Append a decision-log entry to `docs/project-progress.md` summarizing the JSON-snapshot contract: bidirectional, atomically written by the server on every mutation, flat `{ tasks, comments, meta }` shape, consumed by Doctor on missing DB. Include date (`2026-05-18` or current execution date). | 0.25 | R6-4.D.1 | Dependent |

### Stream D Acceptance Criteria

- [ ] End-to-end test passes on a synthetic pre-R6 fixture exercising both the composite `missing-tracker-db` repair and the existing `drifted-file` repair (Kanban→Tracker rename) in the same Doctor run.
- [ ] Second and third consecutive Doctor runs on the migrated fixture yield clean reports (no state drift from repeated invocations).
- [ ] `rg -i 'vibe-kanban|kanban mcp'` returns zero hits in non-historical paths (R6 revision docs + decisions log are the only allowed sources).
- [ ] SRS MAS-204 carries a phase-4 change-log entry referencing the JSON snapshot sub-detail.
- [ ] Decision log in `project-progress.md` records the JSON snapshot contract.

---

## Parallelization Map

```
Gate R6-4.0 (Migration Foundation) ───────────────────┐
                                                       │
                ┌──────────────────────────────────────┤
                │                                      │
Stream A (Server export hook) ───────────────────────► │
Stream B (Pre-R6 migration via Doctor) ──────────────► │
Stream C (Schema & integrity check) ─────────────────► │
                │                                      │
                └── Stream D (Verification &           │
                    Traceability) — depends A + B + C  │
                    ─────────────────────────────────► │
                                                       │
                                                       ▼
                                            Phase 4 complete
```

---

## Definition of Done

- [ ] Gate R6-4.0 acceptance criteria pass.
- [ ] Stream A, B, C, D acceptance criteria pass.
- [ ] No lint errors in files touched by this phase.
- [ ] Full test suite green; the migration end-to-end test and idempotency test pass deterministically.
- [ ] `rg -i 'vibe-kanban|kanban mcp'` returns zero non-historical hits (R6 revision docs and `project-progress.md` decisions log excepted).
- [ ] SRS MAS-204 carries the phase-4 change-log entry; SRS MAS-205 is unchanged.
- [ ] `package.json` `engines.node` unchanged from Phase 1 baseline.

---

## Test Scenarios

### Happy Path

- [ ] Fresh `blueprint init` on a clean directory produces `docs/.blueprint/tasks.db` with `PRAGMA user_version = TRACKER_SCHEMA_VERSION` (already stamped by Phase 1's `applySchema`) and a `.gitignore` containing the tracker DB line; Doctor reports clean.
- [ ] Pre-R6 project (no `tasks.db`, legacy `**Kanban**:` field) → Doctor emits `missing-tracker-db` + `drifted-file`; composite repair provisions DB, seeds `project_meta`, injects `.gitignore` line; field rename applied via existing drift path; second run clean.
- [ ] Mutating CRUD on a running board (`POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id/comments/:cid` with reply cascade) produces an updated `tasks.export.json` reflecting the new state after each request.
- [ ] Pre-R6 project with a pre-existing `tasks.export.json` → composite repair imports the snapshot, populating tasks + comments + project_meta; `seedProjectMeta` is skipped because `project_meta` is already present.

### Edge Cases

- [ ] `.gitignore` absent at repair time → file created with `# Blueprint` section and the tracker DB line.
- [ ] `.gitignore` already contains the tracker DB line → injector is a no-op; second-run report stays clean.
- [ ] `tasks.export.json` malformed (invalid JSON or unexpected shape) → import fails with a warning; repair falls through to `seedProjectMeta`; DB is still provisioned.
- [ ] Server snapshot write fails (disk full or permission denied) → mutation still succeeds, warning logged, JSON unchanged.
- [ ] Existing DB with `PRAGMA user_version = 0` (stale; fixture built via raw `better-sqlite3` open without `applySchema`) → audit opens read-only, observes `0`, emits schema-stale finding; repair calls `openDb` → `applySchema` re-stamps `user_version = TRACKER_SCHEMA_VERSION`; re-audit clean.
- [ ] Corrupted DB (`PRAGMA integrity_check` fails) → non-repairable drift finding; Doctor halts the repair plan with the integrity-check issue list; user resolves manually.
- [ ] Doctor run when both `tasks.db` and `tasks.export.json` are absent → migration creates DB, skips import, seeds from `project-progress.md`, injects `.gitignore`.
- [ ] Concurrent mutating requests against the running board → atomic snapshot rename ensures `tasks.export.json` is always valid JSON; final state matches DB.

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R6-4.TW1), lists affected tasks, and
> includes test impact. See docs/core/tweak-planning.md for the full
> tweak workflow.

_None._

---
