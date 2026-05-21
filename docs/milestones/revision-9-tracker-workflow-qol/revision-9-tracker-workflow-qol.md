# Revision 9 - Tracker Workflow QoL

**Status**: Planning
**Priority**: Next
**Trigger**: 2026-05-21 user request - more quality-of-life changes for agents working the tracker. Status/state semantics, comment ergonomics, task creation ergonomics, board-UI / agent gap, gated transition endpoints, tracker cheatsheet rewrite, and a `blueprint board stop` command.

---

## What Is Changing

Revision 9 deepens the tracker workflow surface introduced by Revision 6 and
hardened by Revision 8 Phase 1. The change has two thrusts:

1. **Phase 1 - Tracker Workflow Endpoints & Contract QoL** adds gated
   workflow HTTP endpoints to the local tracker server so an execution
   agent no longer specifies destination columns by raw `PATCH state`.
   The agent calls a verb endpoint and the server moves the task to the
   correct state, enforcing the source state and rejecting illegal
   transitions. Reviewers `approve` or `reject` (with multiple comments
   in one call) and the task moves to `DONE` or `REWORK` atomically.
   The execution / review / phase-planning / orchestrate doc contracts
   are updated to point agents at the new endpoints and to clean up
   the remaining status/comment/task-creation/board-gap frictions.
2. **Phase 2 - Tracker Cheatsheet & Board Stop Command** rewrites
   `docs/core/tracker.md` as a cheatsheet-first reference. The most
   common agent calls (gated transitions, comment recipes, board
   lifecycle) appear at the top; deeper schema/state-machine/lock
   detail follows below. The phase also ships a new
   `blueprint board stop` subcommand that uses `docs/.blueprint/board.lock`
   to terminate the running board process and clear any stale lock,
   so agents and users no longer have to find the PID by hand.

The new gated endpoints sit beside the existing raw `PATCH /tasks/:id`,
which remains available for compatibility and uncommon transitions.
Agents are directed to the gated endpoints by the updated workflow
contracts; raw PATCH is reserved for explicit cases.

---

## Impact Analysis

### Affected Milestones

| Milestone | Reason |
|-----------|--------|
| M1 - Project Bootstrap | Tracker server and CLI surface live here. |
| Revision 6 - Built-in Task Tracker | This revision deepens R6 Phase 1 (tracker core HTTP API), R6 Phase 2 (board CLI lifecycle), and R6 Phase 3 (tracker protocol docs). |
| Revision 8 - Tweak Revamp & QoL | This revision continues the R8 Phase 1 contract hardening with new endpoints and a cheatsheet-first tracker.md. |

### Affected Phases

| Milestone | Phase | Why |
|-----------|-------|-----|
| Revision 6 | Phase 1 - Tracker Core | Adds new HTTP routes + state-transition logic to the server. |
| Revision 6 | Phase 2 - Board SPA + `blueprint board` Command | Extends the CLI surface with a `stop` subcommand using the existing lock file. |
| Revision 6 | Phase 3 - Protocol Rewrite | `docs/core/tracker.md` is rewritten cheatsheet-first; canonical curl snippets are updated to the new endpoints. |
| Revision 8 | Phase 1 - QoL Workflow Hardening | Workflow contracts are deepened to require the new gated endpoints over raw state PATCH and to refine comment / task-creation / board-gap guidance. |

### Affected Files and Modules

**Tracker server and CLI:**

| File / Area | Change |
|-------------|--------|
| `src/tracker/server.ts`, `src/tracker/routes/**` | Add gated workflow endpoints: `POST /tasks/:id/start`, `/submit`, `/approve`, `/reject`, `/resume`. Source-state enforcement; `409` on illegal transitions. `approve` and `reject` accept an optional array of comments to insert atomically with the state change. |
| `src/tracker/types.ts` | New request/response shapes for gated endpoints and multi-comment payloads. |
| `src/tracker/db.ts` or new helper | Transactional helper for "state change + N comment inserts" so approve/reject is atomic. |
| `src/commands/board.ts` | Route `blueprint board` argv to `start` (current default behavior) and new `stop` subcommand. |
| `src/commands/board-stop.ts` (new) or extension of `board.ts` | Read `board.lock`, send `SIGTERM` to the PID (fallback `SIGKILL`), verify the server is no longer reachable, clear the lock. Handle missing lock and stale lock paths. |
| `src/tracker/board-lock.ts` | Sync read/clear helper sufficient for the stop path if needed; no change to the existing async surface. |
| `src/runtime` command registration | Register the `stop` subcommand alongside the existing `board` command. |
| `src/commands/doctor.ts` | Optional advisory if a stale `board.lock` is detected, pointing the user to `blueprint board stop`. |

**Core protocol docs:**

| File | Change |
|------|--------|
| `docs/core/tracker.md` | Full rewrite as cheatsheet-first. Top of file: gated transitions, multi-comment approve/reject recipes, board lifecycle including `stop`. Schema, state machine, lock semantics, and full curl reference live below the cheatsheet. |
| `docs/core/execution.md` | Replace raw `PATCH /tasks/:id` state-change guidance with the gated `start` / `submit` endpoints. Tighten comment ergonomics so review notes use the new multi-comment payloads where applicable. |
| `docs/core/review.md` | Replace raw `PATCH` guidance with `approve` / `reject`. Document the multi-comment payload pattern for batching review notes with the rejection call. |
| `docs/core/phase-planning.md` | Task creation ergonomics: clarify gate vs stream linkage, dependency capture, and ordering guidance for batch task creation. |
| `docs/core/orchestrate.md` | Update orchestrator references to the new endpoints; no contract change. |
| `docs/core/health-check.md` | Mention `blueprint board stop` as the recovery path for stale or orphaned `board.lock`. |

**Templates and routing:**

| File | Change |
|------|--------|
| `templates/docs/core/tracker.md` | Mirror Phase 2 cheatsheet-first rewrite byte-for-byte. |
| `templates/docs/core/execution.md`, `review.md`, `phase-planning.md`, `orchestrate.md`, `health-check.md` | Mirror Phase 1 updates byte-for-byte. |
| Root / template agent routing docs | No change expected; tracker intent already routes through tracker.md. |

### Affected Tests

| Test Area | Expected Impact |
|-----------|-----------------|
| `tests/tracker/**` (server / routes) | Forward-only tests for the new gated endpoints: state-transition matrix, illegal-transition `409` behavior, multi-comment approve/reject atomicity. |
| `tests/commands/board*.test.ts` | Forward-only tests for the new `blueprint board stop` subcommand: live lock kill path, stale lock cleanup, missing lock no-op, exit codes. |
| `tests/revision-6/**` doc-contract tests | Update tracker.md canonical-structure assertions for the cheatsheet-first layout and the new endpoint reference content. |
| `tests/revision-8/**` doc-contract tests | Update execution.md and review.md assertions where state-change guidance changes from raw `PATCH state` to the gated endpoints. |
| `tests/stream-c/project-templates-mirror.test.ts` and other template mirror tests | Touched live/template protocol docs must remain mirrored. |
| `tests/tracker/doctor*.test.ts` | If Doctor adds a stale-lock advisory, new forward-only coverage for the advisory path. |

### Active Overlap

No in-flight phase work. Revision 8 completed 2026-05-20. Revision 9 can start immediately.

---

## SRS Implications

Classification per `revision-planning.md` `<RevisionSRSImpact>`:

| Requirement ID | Action | Detail |
|----------------|--------|--------|
| MAS-204 | Same ID, elaborated | The tracker still owns the same user outcome: a local HTTP CRUD service exposing task and comment operations for the 5-state machine. Revision 9 elaborates the API surface by adding gated workflow endpoints (`POST /tasks/:id/start | submit | approve | reject | resume`) that enforce the source state on the server and accept multi-comment payloads on `approve` / `reject`. The state machine itself is unchanged. |
| MAS-205 | Same ID, elaborated | The local board UI still owns the same user outcome. Revision 9 extends the `blueprint board` command lifecycle with a `stop` subcommand that terminates the running server using `board.lock` and clears stale locks. Boot, dynamic port binding, headless behavior, and `SIGINT` shutdown remain unchanged. |
| MAS-203 | No change | Orchestration is not modified by this revision (per planning confirmation). Phase 1 doc updates touch `orchestrate.md` only to point at the new endpoint names without changing the orchestrator contract. |

No SRS supersession. No new requirement IDs.

---

## Phases

This revision requires **two phases**. Phase 2 depends on Phase 1 because
the cheatsheet rewrite documents Phase 1's new endpoints, and the
`stop` command rides alongside as the second board-lifecycle CLI surface.

| Phase | Name | Scope Summary |
|-------|------|---------------|
| 1 | Tracker Workflow Endpoints & Contract QoL | Add gated workflow HTTP endpoints (`start` / `submit` / `approve` / `reject` / `resume`) with source-state enforcement and multi-comment payloads on approve/reject. Update execution / review / phase-planning / orchestrate / health-check docs and their template mirrors to point agents at the new endpoints and to tighten task creation, comment, and board-gap guidance. |
| 2 | Tracker Cheatsheet & Board Stop Command | Rewrite `docs/core/tracker.md` and its template mirror as a cheatsheet-first reference reflecting Phase 1's endpoints. Implement the `blueprint board stop` subcommand using `board.lock` to kill the live PID and clear stale locks. Optional Doctor advisory for stale locks. |

---

## Success Criteria

- [ ] Tracker server exposes `POST /tasks/:id/start`, `/submit`, `/approve`, `/reject`, `/resume` with source-state enforcement and `409` on illegal transitions.
- [ ] `approve` and `reject` accept an optional array of comments and apply the state change plus comment inserts atomically.
- [ ] Execution and review doc contracts point agents at the gated endpoints instead of raw `PATCH state` for the canonical state transitions.
- [ ] Phase planning guidance for task creation captures gate/stream linkage, dependencies, and ordering without stream-title duplication.
- [ ] `docs/core/tracker.md` opens with a cheatsheet reflecting the new endpoints, comment recipes, and full board lifecycle including `stop`.
- [ ] `blueprint board stop` terminates a live board process by reading `board.lock`, clears stale locks, and is a no-op when no lock exists.
- [ ] Touched core docs and their `templates/docs/core/**` mirrors stay byte-for-byte aligned.
- [ ] MAS-204 and MAS-205 change-log entries record the Revision 9 elaboration.
- [ ] Full test suite remains green after forward-only test updates.

---

## Explicitly Not Changing

| File / Area | Reason |
|-------------|--------|
| Tracker schema (`src/tracker/schema.ts`) | Gated endpoints reuse existing `tasks` and `review_comments` columns. No DDL changes. |
| 5-state machine | TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE and the canonical REWORK forward path are unchanged. |
| Raw `PATCH /tasks/:id` | Stays available for compatibility and uncommon transitions; not removed by this revision. |
| SPA / board UI surface | No UI changes planned. The board-UI ↔ agent gap is closed through doc/contract updates and the new endpoints, not UI work. |
| Tweak planning workflow | Revision 8 Phase 2 owns the current MAS-207 change-first workflow. Revision 9 does not touch it. |
| Orchestration contract (MAS-203) | Untouched per planning confirmation. |
| Historical milestone / phase / revision docs | Remain audit history. |

---

## Sequencing & Triggers

- Revision 9 is the next pending revision after Revision 8.
- Phase 1 can be planned immediately because the endpoint surface and contract updates are scoped above.
- Phase 2 should be planned after Phase 1 is reviewed, because the cheatsheet must reflect Phase 1's shipped endpoints and the `stop` command rides on the existing `board.lock` contract that Phase 1 does not modify.
