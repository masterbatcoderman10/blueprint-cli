# Phase 1 — Tracker Core (Schema + CRUD Server) Plan

**Status**: Planning
**Milestone**: Revision 6 — Built-in Task Tracker
**Sequencing**: Do not start execution until Revision 5 — Orchestration Protocol completes (R6 Phase 3 will rewrite `orchestrate.md` shipped by R5).

---

## Goals

- A per-project SQLite database (`docs/.blueprint/tasks.db`) exists and is automatically created and migrated by `blueprint init` with the full Phase 1 schema (`tasks`, `review_comments`, `project_meta`).
- A stand-alone HTTP CRUD surface — task CRUD, threaded comment CRUD, and a `/project` meta route — runs on `127.0.0.1` against that DB and is exercisable from `curl` for integration testing.
- A temporary `blueprint board --headless` command boots the server, prints the assigned port, and shuts down cleanly on SIGINT. The default `blueprint board` invocation prints a deferred-SPA notice and exits — the SPA lands in Phase 2.
- The repo's Node version requirement moves to `>=22.5.0` so `node:sqlite` (built-in, zero runtime deps) is usable.
- No protocol-doc rewrites happen in this phase — that surface lands in Phase 3.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 5 — Orchestration Protocol complete | Pending (gating R6 start; not required for Phase 1 planning) |
| Node.js ≥22.5 available in dev + CI environments | Available (action: bump `engines.node` in Phase 1) |
| Existing CLI runtime + `init` / `doctor` commands (`src/runtime/index.ts`, `src/commands/{init,doctor}.ts`) | Complete (M1) |
| Existing `docs/.blueprint/` precedent (`docs/.blueprint/manifest.json` via `src/doctor/manifest.ts`) | Complete (M1) |
| `docs/conventions.md` testing policy (Vitest, forward-only) | Available |

---

## Locked Decisions

These were resolved during phase planning and must not be re-litigated during execution. Source: approved plan at `/Users/mali/.claude/plans/streamed-enchanting-castle.md`.

| Decision | Value |
|----------|-------|
| Task PK | Slug TEXT (`tasks.id` = full Blueprint task ID, e.g. `R6-1.A.1`) |
| Timestamps | INTEGER (Unix epoch milliseconds) |
| Dependency modeling | Not in P1 — no deps column or table |
| Comment `line` field | Free-form TEXT, nullable |
| State column | TEXT with `CHECK IN ('TO-DO','IN-PROGRESS','IN-REVIEW','REWORK','DONE')` |
| Tasks + comments scope in P1 | Both schemas + both CRUD surfaces |
| Server posture | Real listener on `127.0.0.1:0` via temporary `blueprint board --headless` flag (P2 absorbs) |
| `/project` meta source | DB row in `project_meta` table, seeded at `blueprint init` time |
| Error response shape | JSON envelope `{ error: { code, message } }` + appropriate HTTP status |
| Engines bump | `engines.node: ">=22.5.0"` lands in P1 |
| Migration framework | Single in-place `applySchema(db)` in P1 (no general runner) |
| Runtime deps added | Zero (`node:sqlite`, `node:http`, `node:path`, `node:url` are built-ins) |

---

## Gate R6-1.0 — DB & Project Root Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-1.0.1 | Bump `package.json` `engines.node` to `>=22.5.0` and document the requirement in `docs/conventions.md` under Runtime. | 0.25 | None | Independent |
| R6-1.0.2 | Author `src/tracker/schema.ts` — DDL for `tasks`, `review_comments`, `project_meta`, indexes, FK cascade, state CHECK. Exported as a single `applySchema(db)` function. | 0.75 | R6-1.0.1 | Dependent |
| R6-1.0.3 | Author `src/tracker/db.ts` — `openDb(projectRoot)` opens `docs/.blueprint/tasks.db` via `node:sqlite`, enables foreign keys (`PRAGMA foreign_keys = ON`), runs `applySchema` idempotently, returns a typed handle. | 0.75 | R6-1.0.2 | Dependent |
| R6-1.0.4 | Author `src/tracker/project-root.ts` — walks up from `cwd` looking for `docs/.blueprint/`. Returns the project root or throws an actionable error (`not in a Blueprint project — run \`blueprint init\` here first`). | 0.5 | None | Independent |
| R6-1.0.5 | Extend `src/commands/init.ts` — after the existing scaffold runs, call `openDb(projectRoot)` (creates + migrates) and `INSERT OR REPLACE` a single `project_meta` row populated from the project name and PRD tagline collected during onboarding. | 0.75 | R6-1.0.3, R6-1.0.4 | Dependent |

### Gate Acceptance Criteria

- [ ] `package.json` `engines.node` is `>=22.5.0`; `npm test` runs on Node 22.5 LTS.
- [ ] `docs/conventions.md` references the Node ≥22.5 requirement and notes `node:sqlite` as the storage backend (preserving the "no runtime deps for simple file I/O" rule verbatim).
- [ ] `applySchema` creates `tasks`, `review_comments`, `project_meta` with the documented columns, indexes (`tasks(state)`, `tasks(phase, stream)`, `review_comments(task_id)`, `review_comments(parent_id)`), the state CHECK constraint, and the `review_comments(task_id) REFERENCES tasks(id) ON DELETE CASCADE` FK.
- [ ] Calling `applySchema` on an already-migrated DB is a no-op (idempotent).
- [ ] `openDb` returns a usable handle with `PRAGMA foreign_keys = ON`.
- [ ] `findProjectRoot()` resolves from any subdirectory of a Blueprint project and throws the documented error message elsewhere.
- [ ] Fresh `blueprint init` produces `docs/.blueprint/tasks.db` with the schema applied and a populated `project_meta` row.

---

## Stream A — Task CRUD module

> Stand-alone route module exporting handlers for the `/tasks` family. No HTTP server wiring (that's Stream C). Pure functions over the DB handle.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-1.A.1 | Author `src/tracker/routes/tasks.ts` — `createTask`, `getTask`, `listTasks(filter)`, `updateTask`, `deleteTask` functions taking `(db, input)` and returning a `Result<TData, TError>` union with the JSON error envelope shape. Includes `phase` and `stream` filter support on `listTasks`. | 1.5 | Gate | Dependent |
| R6-1.A.2 | Author `src/tracker/types.ts` (Task subset) — `Task`, `TaskState`, `CreateTaskInput`, `UpdateTaskInput`, `TaskFilter`, `TaskError` discriminated unions. Re-export from `src/tracker/index.ts` for the server stream to consume. | 0.5 | R6-1.A.1 | Dependent |
| R6-1.A.3 | Tests `tests/tracker/tasks.test.ts` — unit tests against an in-memory or temp-file DB exercising every CRUD function: create+get roundtrip, list filters, partial update, delete, error envelopes (`task_not_found`, `invalid_state`, `duplicate_id`). | 1.0 | R6-1.A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] `createTask` rejects invalid `state` values with `{ error: { code: 'invalid_state', message } }` before reaching SQLite.
- [ ] `createTask` rejects duplicate IDs with `{ error: { code: 'duplicate_id', message } }`.
- [ ] `listTasks({ phase, stream })` returns only matching tasks; omitted filters mean "all".
- [ ] `getTask`, `updateTask`, `deleteTask` return `task_not_found` on missing IDs.
- [ ] `updateTask` is partial — unspecified fields are unchanged and `updated_at` advances.
- [ ] All tests pass; coverage is forward-only per `conventions.md`.

---

## Stream B — Comment CRUD module

> Stand-alone route module for `/tasks/:id/comments`. Mirrors Stream A's pure-function shape. Independent of Stream A — different table, different handlers; tests share only the schema fixture.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-1.B.1 | Author `src/tracker/routes/comments.ts` — `createComment`, `listComments(taskId)`, `updateComment`, `deleteComment`. `createComment` accepts `{ severity, body, author?, line?, parent_id? }`; validates that `severity ∈ { 'MAJOR', 'MINOR' }`, that `parent_id` (if present) references an existing comment on the same task, and that the task exists. | 1.5 | Gate | Dependent |
| R6-1.B.2 | Extend `src/tracker/types.ts` with comment types — `ReviewComment`, `CommentSeverity`, `CreateCommentInput`, `UpdateCommentInput`, `CommentError`. Re-export. | 0.25 | R6-1.B.1 | Dependent |
| R6-1.B.3 | Tests `tests/tracker/comments.test.ts` — CRUD roundtrip, severity validation, parent_id-on-different-task rejection (`invalid_parent`), task-deletion cascade verification, list returns flat (client builds tree). | 1.0 | R6-1.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] `createComment` with `severity` outside `MAJOR / MINOR` returns `invalid_severity`.
- [ ] `createComment` with `parent_id` pointing to a comment on a different task returns `invalid_parent`.
- [ ] `createComment` against a non-existent `task_id` returns `task_not_found`.
- [ ] Deleting a task cascades all its `review_comments` (verified by row count + FK pragma test).
- [ ] `listComments(taskId)` returns a flat array sorted by `created_at` ascending; tree construction is the SPA's job (Phase 2).
- [ ] All tests pass.

---

## Stream C — HTTP server + `blueprint board --headless` command

> Wraps Streams A + B into an HTTP listener; exposes the `/project` meta route; ships the temporary `--headless` command. Runs **after** Streams A and B reach IN-REVIEW because every C task imports their handler modules.
> **Depends on:** Stream A (task handler module exported from `routes/tasks.ts`) and Stream B (comment handler module exported from `routes/comments.ts`).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-1.C.1 | Author `src/tracker/server.ts` — `createServer({ db })` returns a `node:http` server. Imports task handlers from Stream A and comment handlers from Stream B; internal router dispatches: `POST /tasks` → A, `GET /tasks` → A, `GET /tasks/:id` → A, `PATCH /tasks/:id` → A, `DELETE /tasks/:id` → A, `POST /tasks/:id/comments` → B, `GET /tasks/:id/comments` → B, `PATCH /tasks/:id/comments/:cid` → B, `DELETE /tasks/:id/comments/:cid` → B, `GET /project` → reads `project_meta` row. Unmatched routes → 404 with `{ error: { code: 'not_found' } }`. JSON body parsing + JSON serialization centralized. | 1.5 | R6-1.A.3, R6-1.B.3 | Dependent |
| R6-1.C.2 | Author `src/commands/board.ts` — registers the `blueprint board` command. Accepts `--headless` flag. Behavior in `--headless`: resolve project root → `openDb` → `createServer` → `listen({ host: '127.0.0.1', port: 0 })` → log `Board available at http://127.0.0.1:<port>` → wait for SIGINT → close server + DB. Without `--headless`: log `SPA not yet available — Phase 2 will add the UI. Use --headless to start the API server now.` and exit 0. | 1.0 | R6-1.C.1 | Dependent |
| R6-1.C.3 | Register `board` in `src/index.ts` runtime via the existing `runtime.register(...)` pattern (mirrors `init` / `doctor`). | 0.25 | R6-1.C.2 | Dependent |
| R6-1.C.4 | Tests `tests/tracker/server.test.ts` — boot server on dynamic port, exercise every route end-to-end via `fetch`, verify status codes + JSON envelopes for both success and error paths, verify graceful shutdown closes the DB handle (no `SQLITE_BUSY` on subsequent open). Also covers `GET /project` reading from `project_meta`. | 1.5 | R6-1.C.3 | Dependent |
| R6-1.C.5 | Tests `tests/commands/board.test.ts` — `--headless` boots and logs the port; default invocation prints the deferred-SPA message and exits 0; project-root resolution failure surfaces actionably. | 0.75 | R6-1.C.4 | Dependent |

### Stream C Acceptance Criteria

- [ ] `createServer` returns a configured `node:http.Server` listening on `127.0.0.1` only when started.
- [ ] All 10 routes return correct status codes and JSON shapes (success + error envelopes).
- [ ] `GET /project` returns the `project_meta` row as `{ name, tagline, phaseCount?, streamCount? }` (phase / stream counts may be `null` in P1 if not yet wired; field is reserved).
- [ ] `blueprint board --headless` boots, prints the assigned port, holds open until SIGINT, and shuts down cleanly.
- [ ] `blueprint board` without `--headless` prints the deferred-SPA message and exits 0.
- [ ] Running `blueprint board --headless` outside a Blueprint project surfaces the project-root error from Gate without leaving a stray DB handle.
- [ ] All tests pass.

---

## Parallelization Map

```
Gate R6-1.0 (Engines bump → schema → db open → project-root → init wiring) ─┐
                                                                             │
                       ┌─────────────────────────────────────────────────────┤
                       │                                                     │
Stream A (Task CRUD module + types + tests) ───────────────────────────────► │
Stream B (Comment CRUD module + types + tests) ────────────────────────────► │
                       │                                                     │
                       └── Stream C (HTTP server + board command + tests)    │
                           depends on A + B ────────────────────────────────►│
                                                                             │
                                                                             ▼
                                                              Phase 1 complete
```

Stream A and Stream B execute fully in parallel — no inter-stream dependency. Stream C starts only after A and B reach IN-REVIEW, because every C task imports the route modules those streams publish. This is the canonical pattern from `phase-planning.md` `<PhaseExample>` (Stream C depends on A + B).

---

## Out of Scope (intentional Phase 1 cuts)

- No SPA, no static asset serving — Phase 2.
- No browser-open dispatch (`open` / `xdg-open` / `start`) — Phase 2.
- No protocol doc rewrites (`docs/core/*.md`, templates) — Phase 3.
- No Doctor checks for `tasks.db` integrity / pre-R6 migration — Phase 4.
- No `.gitignore` injection for `docs/.blueprint/tasks.db` — revision-doc deferred item #2; revisit in Phase 4.
- No dependency modeling (no `task_dependencies` table, no `depends_on` column) — deferred to a later phase or revision.
- No activity / event log — revision-doc deferred item #5.
- No advisory lock file `board.lock` — revision-doc deferred item #3; not needed in P1 since headless boot is for testing.
- No general-purpose migration runner — single in-place `applySchema` is sufficient for P1.

---

## Test Plan

> Generated from task analysis per `test-planning.md`. Each testable task has one or more tests mapped to it. Tests are written BEFORE implementation (TDD) during task execution. Framework: Vitest (per `docs/conventions.md`). The standalone "test artifact" tasks (R6-1.A.3, R6-1.B.3, R6-1.C.4, R6-1.C.5) ARE the authoring of the test files listed below — they appear as Not Testable rows because they have no further behavior to verify beyond producing the tests.

### Gate R6-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-1.0.1 | R6-1.0.1 | unit | `package.json` `engines.node` parses and semver-satisfies `>=22.5.0`. | Assertion passes; range covers 22.5.0 and above. |
| T-1.0.2.1 | R6-1.0.2 | unit | `applySchema(db)` creates `tasks`, `review_comments`, `project_meta` tables. | `sqlite_master` query returns all three table names. |
| T-1.0.2.2 | R6-1.0.2 | unit | `tasks` table has the documented columns + types. | `PRAGMA table_info(tasks)` returns expected name/type/notnull for `id`, `title`, `description`, `state`, `phase`, `stream`, `author`, `implementation_notes`, `created_at`, `updated_at`. |
| T-1.0.2.3 | R6-1.0.2 | unit | `review_comments` table has expected columns including `parent_id` self-reference and FK to `tasks.id`. | `PRAGMA table_info` + `PRAGMA foreign_key_list` confirm shape. |
| T-1.0.2.4 | R6-1.0.2 | unit | State CHECK rejects invalid values. | `INSERT INTO tasks (..., state='BOGUS', ...)` raises `SQLITE_CONSTRAINT_CHECK`. |
| T-1.0.2.5 | R6-1.0.2 | unit | Documented indexes exist: `tasks(state)`, `tasks(phase, stream)`, `review_comments(task_id)`, `review_comments(parent_id)`. | `sqlite_master` query for `type='index'` lists all four. |
| T-1.0.2.6 | R6-1.0.2 | unit | `applySchema` is idempotent — calling twice on the same DB leaves schema and data unchanged. | Second call completes without error; row counts unchanged. |
| T-1.0.3.1 | R6-1.0.3 | integration | `openDb(projectRoot)` creates the DB file and returns a working handle. | File exists at `<root>/docs/.blueprint/tasks.db`; basic query executes. |
| T-1.0.3.2 | R6-1.0.3 | integration | `openDb` enables foreign keys. | `PRAGMA foreign_keys` returns `1`. |
| T-1.0.3.3 | R6-1.0.3 | integration | `openDb` is safe to call on an existing DB (no truncation, no migration loop). | Pre-existing row remains; schema unchanged. |
| T-1.0.4.1 | R6-1.0.4 | unit | `findProjectRoot()` resolves from any subdirectory of a Blueprint project. | Returns the absolute path of the root containing `docs/.blueprint/`. |
| T-1.0.4.2 | R6-1.0.4 | unit | `findProjectRoot()` throws the documented actionable error outside any Blueprint project. | Error message matches `not in a Blueprint project — run \`blueprint init\` here first`. |
| T-1.0.5.1 | R6-1.0.5 | integration | After `blueprint init`, `docs/.blueprint/tasks.db` exists with the schema applied. | Tables exist; `PRAGMA user_version` reflects current schema version. |
| T-1.0.5.2 | R6-1.0.5 | integration | After `blueprint init`, `project_meta` contains a single row with the seeded project name and tagline. | `SELECT * FROM project_meta` returns one row matching the init prompts' inputs. |
| — | R6-1.0.1 | — | Not separately testable beyond T-1.0.1: the `conventions.md` text edit is documentation. | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | R6-1.A.1 | unit | `createTask` happy path inserts and returns the new task. | Returned shape matches input + generated timestamps; row exists in DB. |
| T-A.1.2 | R6-1.A.1 | unit | `createTask` with invalid `state` returns `{ error: { code: 'invalid_state' } }` and does not insert. | Result is error envelope; row count unchanged. |
| T-A.1.3 | R6-1.A.1 | unit | `createTask` with duplicate `id` returns `{ error: { code: 'duplicate_id' } }`. | Error envelope; first row remains. |
| T-A.1.4 | R6-1.A.1 | unit | `getTask` returns the task by ID. | Returned shape matches stored row. |
| T-A.1.5 | R6-1.A.1 | unit | `getTask` on missing ID returns `task_not_found`. | Error envelope. |
| T-A.1.6 | R6-1.A.1 | unit | `listTasks()` with no filter returns all rows. | Length matches inserted count. |
| T-A.1.7 | R6-1.A.1 | unit | `listTasks({ phase, stream })` filters correctly. | Only matching rows returned. |
| T-A.1.8 | R6-1.A.1 | unit | `updateTask` partial update preserves unspecified fields and advances `updated_at`. | Targeted fields change; others identical; `updated_at` > original. |
| T-A.1.9 | R6-1.A.1 | unit | `updateTask` on missing ID returns `task_not_found`. | Error envelope. |
| T-A.1.10 | R6-1.A.1 | unit | `deleteTask` removes the row. | Subsequent `getTask` returns `task_not_found`. |
| T-A.1.11 | R6-1.A.1 | unit | `deleteTask` on missing ID returns `task_not_found`. | Error envelope. |
| — | R6-1.A.2 | — | Not testable: type-only module; verified by TypeScript compilation during build. | — |
| — | R6-1.A.3 | — | Not testable: task IS the authoring of the test artifact covering T-A.1.1 – T-A.1.11 above. | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | R6-1.B.1 | unit | `createComment` happy path on an existing task with severity `MAJOR`. | Row inserted; returned shape matches; `parent_id` is `NULL`. |
| T-B.1.2 | R6-1.B.1 | unit | `createComment` with `severity` outside `MAJOR / MINOR` returns `invalid_severity`. | Error envelope; no insert. |
| T-B.1.3 | R6-1.B.1 | unit | `createComment` with `parent_id` referencing a comment on a different task returns `invalid_parent`. | Error envelope; no insert. |
| T-B.1.4 | R6-1.B.1 | unit | `createComment` against a non-existent `task_id` returns `task_not_found`. | Error envelope. |
| T-B.1.5 | R6-1.B.1 | unit | Reply: `createComment` with `parent_id` referencing a sibling comment on the same task succeeds. | Row inserted with `parent_id` set. |
| T-B.1.6 | R6-1.B.1 | unit | `listComments(taskId)` returns flat array sorted by `created_at` ascending. | Order matches insertion order under monotonic clock. |
| T-B.1.7 | R6-1.B.1 | unit | `updateComment` mutates body / line / severity; rejects severity transition to invalid value. | Update applied; invalid severity rejected with envelope. |
| T-B.1.8 | R6-1.B.1 | unit | `deleteComment` removes the comment. | Subsequent `listComments` excludes it. |
| T-B.1.9 | R6-1.B.1 | integration | Deleting the parent task cascades all `review_comments` for it. | `listComments(taskId)` returns `[]`; raw `SELECT COUNT(*) WHERE task_id = ?` returns `0`. |
| — | R6-1.B.2 | — | Not testable: type-only extension; verified by TypeScript compilation. | — |
| — | R6-1.B.3 | — | Not testable: task IS the authoring of the test artifact covering T-B.1.1 – T-B.1.9 above. | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | R6-1.C.1 | integration | Server boots on `127.0.0.1:0` and reports the assigned port. | `server.address()` returns `{ address: '127.0.0.1', port: N }` with N > 0. |
| T-C.1.2 | R6-1.C.1 | integration | `POST /tasks` round-trips through to Stream A handler. | 201 + JSON body matching created task. |
| T-C.1.3 | R6-1.C.1 | integration | `GET /tasks` returns the list. | 200 + array. |
| T-C.1.4 | R6-1.C.1 | integration | `GET /tasks/:id` and `PATCH /tasks/:id` and `DELETE /tasks/:id` dispatch correctly. | Each returns the expected status + envelope. |
| T-C.1.5 | R6-1.C.1 | integration | Comment routes (`POST/GET /tasks/:id/comments`, `PATCH/DELETE /tasks/:id/comments/:cid`) dispatch through to Stream B handlers. | All return expected status + envelope. |
| T-C.1.6 | R6-1.C.1 | integration | `GET /project` returns the seeded `project_meta` row. | 200 + `{ name, tagline, ... }`. |
| T-C.1.7 | R6-1.C.1 | integration | Unknown route returns 404 with `{ error: { code: 'not_found' } }`. | Status 404; JSON envelope matches. |
| T-C.1.8 | R6-1.C.1 | integration | Error envelopes carry correct HTTP status: `invalid_state` → 400, `task_not_found` → 404, `duplicate_id` → 409. | Each maps as documented. |
| T-C.1.9 | R6-1.C.1 | integration | Server graceful close releases the DB handle (no `SQLITE_BUSY` on immediate re-open). | `openDb` called immediately after close succeeds. |
| T-C.2.1 | R6-1.C.2 | integration | `blueprint board --headless` boots the server, logs the assigned port, and stays foreground until SIGINT. | stdout contains `Board available at http://127.0.0.1:<port>`; process remains alive; SIGINT exits 0. |
| T-C.2.2 | R6-1.C.2 | integration | `blueprint board` (no flag) logs the deferred-SPA message and exits 0. | stdout matches `SPA not yet available — Phase 2 will add the UI. Use --headless to start the API server now.`; exit code 0. |
| T-C.2.3 | R6-1.C.2 | integration | `blueprint board --headless` outside a Blueprint project surfaces the project-root error and exits non-zero without leaving stray handles. | stderr matches the documented project-root error; exit code non-zero; no `tasks.db` created. |
| T-C.3.1 | R6-1.C.3 | unit | `runtime.dispatch(['board'])` resolves to the registered handler. | `matched: true`; handler invoked. |
| — | R6-1.C.4 | — | Not testable: task IS the authoring of the server test artifact (T-C.1.1 – T-C.1.9). | — |
| — | R6-1.C.5 | — | Not testable: task IS the authoring of the board command test artifact (T-C.2.1 – T-C.2.3, T-C.3.1). | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable | Tests Defined |
|-----------|-------------|----------|--------------|---------------|
| Gate R6-1.0 | 5 | 5 | 0 (the doc-edit half of R6-1.0.1 is folded into T-1.0.1) | 14 |
| Stream A | 3 | 1 | 2 | 11 |
| Stream B | 3 | 1 | 2 | 9 |
| Stream C | 5 | 3 | 2 | 13 |
| **Total** | **16** | **10** | **6** | **47** |

---

## Definition of Done

- [ ] Gate R6-1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] All 47 tests in the Test Plan pass.
- [ ] Full pre-existing test suite remains green.
- [ ] No lint errors in files touched by this phase.
- [ ] `npm test` and `npm run build` (after engines bump) both pass on Node 22.5 LTS.
- [ ] Fresh `blueprint init` produces `docs/.blueprint/tasks.db` with a populated `project_meta` row; subsequent `blueprint board --headless` boots and serves a working `GET /project`.

---

## Test Scenarios

### Happy Path
- [ ] Fresh `blueprint init` → DB created, schema applied, `project_meta` seeded.
- [ ] `blueprint board --headless` boots → `curl POST /tasks` creates a task → `curl GET /tasks` returns it → `curl POST /tasks/:id/comments` adds a MAJOR comment → `curl POST /tasks/:id/comments` adds a reply with `parent_id` → `curl GET /tasks/:id/comments` returns both flat → `curl DELETE /tasks/:id` cascades and `GET /tasks/:id/comments` returns empty.
- [ ] `curl GET /project` returns the seeded name + tagline.

### Edge Cases
- [ ] Duplicate task ID on create → `duplicate_id` envelope, 409.
- [ ] Invalid `state` value → `invalid_state`, 400.
- [ ] Invalid `severity` on comment → `invalid_severity`, 400.
- [ ] Reply with `parent_id` on a different task → `invalid_parent`, 400.
- [ ] `PATCH` / `DELETE` / `GET` on missing task → `task_not_found`, 404.
- [ ] Unknown route → `not_found`, 404.
- [ ] `blueprint board --headless` outside a Blueprint project → project-root error, non-zero exit, no stray DB.
- [ ] Re-running `applySchema` on an existing DB is a no-op (idempotency check).
- [ ] SIGINT during open requests → server drains, DB closes cleanly, exit 0.

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here. Each tweak has an ID (e.g., R6-1.TW1), lists affected tasks, and includes test impact. See `docs/core/tweak-planning.md` for the full tweak workflow.

_None._
