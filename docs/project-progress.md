# Project Progress

**Project**: blueprint-cli
**Tracker**: blueprint-cli
**Current Milestone**: Revision 6 — Built-in Task Tracker
**Current Phase**: TBD — pending phase planning
**Status**: Revision 6 complete — all phases done

---

## Decisions

> Append entries as decisions are made. Never delete. Oldest at top.

- 2026-03-05: Selected TypeScript on Node.js with npm distribution for the CLI to optimize developer iteration and package delivery.
- 2026-03-05: Selected Vitest as the default forward-only testing framework for new CLI work.
- 2026-03-05: Set MVP boundary after Milestone 1; Milestone 2 and later are optional post-MVP scope.
- 2026-03-05: Confirmed the project is open source and requires an explicit LICENSE declaration before first public release.
- 2026-03-05: Selected MIT as the project license.
- 2026-03-05: Phase 1 — CLI Foundation completed. All tasks done, DoD satisfied, full test suite green.
- 2026-03-05: Phase 2 Stream C (Execution Engine & Integration) completed. Archive engine, scaffold engine, agent file generator, git initializer, and summary reporter implemented. All 19 Stream C tests pass. Full test suite: 115 tests green.
- 2026-03-05: Phase 2 — Scaffold Engine completed. All tasks done, DoD satisfied, full test suite green (118 tests, 16 files).
- 2026-03-07: Phase 3 — Template Integrity moved from planning to in progress after completing detailed test planning.
- 2026-03-07: Phase 3 Stream C (Repair & Update Flow) completed. Repair planner, repair executor, and Doctor command flow implemented. All 22 Stream C tests pass. Full test suite: 218 tests (3 pre-existing failures from Stream A template naming).
- 2026-03-14: Phase 3 — Template Integrity completed. All tasks done, DoD satisfied, full test suite green (217 tests, 31 files).
- 2026-03-16: Phase 4 — Testing Setup & Release Readiness completed. All tasks done, DoD satisfied, full test suite green (266 tests, 45 files).
- 2026-03-16: Milestone 1 — Project Bootstrap completed. All phases done.
- 2026-03-20: Identified Revision 1 — CLI Discoverability & Help to change root invocation and incorrect-command behavior for the existing M1 CLI surface. Impact spans M1 Phases 1, 3, and 4; revision document created at `docs/milestones/revision-1-cli-discoverability/`.
- 2026-03-20: Revision 1 Phase 1 — Root Help & Dispatch Contract was planned and test-planned. Phase document committed and ready for execution.
- 2026-03-21: Revision 1 Phase 1 — Root Help & Dispatch Contract completed. All tasks done, DoD satisfied, full test suite green (286 tests, 48 files).
- 2026-03-22: Revision 1 Phase 2 Stream C (Regression Coverage & Boundary Protection) completed. All 19 Stream C regression tests pass, protecting the unknown-command recovery contract, command-help entrypoint alignment, and Phase 1 root-help boundary. Full test suite: 321 tests (7 pre-existing failures from Phase 4 build-related tests).
- 2026-03-22: Phase 2 — Incorrect Command Recovery & Command-Level Guidance completed. All tasks done, DoD satisfied, full test suite green (340 tests, 54 files).
- 2026-03-22: Revision 1 Phase 3 — Documentation & Regression Coverage Alignment completed. All tasks done, DoD satisfied, full test suite green (410 tests, 60 files).
- 2026-03-22: Revision 1 — CLI Discoverability & Help completed. All phases done.
- 2026-03-25: Identified Revision 2 — Tweak Contract to add a lightweight in-phase correction mechanism. Impact spans M1 Phases 2 and 3 (templates and Doctor); purely additive. Revision document created at `docs/milestones/revision-2-tweak-contract/`.
- 2026-03-26: Revision 2 Phase 1 — Tweak Contract & Template Integration completed. All tasks done, DoD satisfied, full test suite green (425 tests, 61 files).
- 2026-03-26: Revision 2 — Tweak Contract completed. All phases done.
- 2026-03-26: Identified Revision 3 — SRS Integration to introduce a Software Requirements Specification document as a progressive source of truth bridging the PRD and phase plans. Impact spans M1 Phases 2, 3, and 4; 3 phases planned. Revision document created at `docs/milestones/revision-3-srs-integration/`.
- 2026-03-28: Revision 3 Phase 1 — SRS Module & Structural Registration completed. All tasks done, DoD satisfied, full test suite green (453 tests, 67 files).
- 2026-03-29: Revision 3 Phase 2 — Alignment & PRD Flow Rework completed. All tasks done, DoD satisfied, full test suite green (453 tests, 67 files).
- 2026-03-29: Revision 3 Phase 3 — Planning Module Integration was planned. Phase document committed and ready for execution.
- 2026-03-29: Revision 3 Phase 3 — Planning Module Integration completed. All tasks done, DoD satisfied, full test suite green (453 tests, 67 files).
- 2026-03-29: Revision 3 — SRS Integration completed. All phases done.
- 2026-04-07: Identified Revision 4 — Anti-Patterns to introduce specific process constraints and "what-not-to-do" guidance to core documentation. Impact spans several core modules (alignment, srs-planning, milestone-planning, phase-planning, revision-planning, git-execution-workflow). Revision document created at `docs/milestones/revision-4-anti-patterns/revision-4-anti-patterns.md`.
- 2026-04-08: Revision 4 Phase 1 — Structural & SRS Foundation completed. All tasks done, DoD satisfied.
- 2026-04-09: Revision 4 Phase 2 — Document Updates (Alignment, SRS, Milestone) completed. All tasks done, DoD satisfied, full test suite green (461 tests, 70 files).
- 2026-04-10: Revision 4 Phase 3 — Document Updates (Phase, Revision, Git Workflow) was planned and test-planned. Phase document committed and ready for execution.
- 2026-05-13: Revision 4 Phase 3 — Document Updates (Phase, Revision, Git Workflow) completed. All tasks done, DoD satisfied, full test suite green (467 tests, 72 files).
- 2026-05-17: Revision 4 Phase 4 — Verification & Cleanup completed. All tasks done, DoD satisfied, full test suite green (472 tests, 75 files).
- 2026-05-17: Revision 4 — Anti-Patterns completed. All phases done.
- 2026-05-17: Identified Revision 5 — Orchestration Protocol to introduce `docs/core/orchestrate.md` as a new core module that turns an agent into a phase/stream orchestrator with parallel-subagent dispatch per the parallelization map and independent per-stream execute→review→address→rereview loops. Impact: additive — new core module, routing rows in all 4 agent entry points + project `CLAUDE.md`, template propagation via `templates/docs/core/orchestrate.md`, Doctor / template-integrity canonical-core-file list expansion. SRS requirement MAS-203 created (status: approved-pending-implementation). Revision document at `docs/milestones/revision-5-orchestration/revision-5-orchestration.md`.
- 2026-05-17: Revision 5 Phase 1 — Orchestration Module & Routing Integration was planned. Phase document committed and ready for execution.
- 2026-05-17: Revision 5 Phase 1 — Orchestration Module & Routing Integration completed. All tasks done, DoD satisfied, full test suite green (485 tests, 79 files).
- 2026-05-17: Revision 5 — Orchestration Protocol completed. All phases done.
- 2026-05-17: Identified Revision 6 — Built-in Task Tracker to replace the external `vibe-kanban` MCP dependency with a built-in per-project task tracker (SQLite backend + local Svelte SPA) provisioned by the CLI. Impact: hybrid additive + modifying — new tracker backend / SPA / `blueprint board` command plus protocol rewrites, tracker field renaming, and REWORK-state adoption. SRS requirements MAS-204 and MAS-205 created (status: approved-pending-implementation). Revision document at `docs/milestones/revision-6-built-in-tracker/revision-6-built-in-tracker.md`.
- 2026-05-18: Revision 6 Phase 1 — Tracker Core (Schema + CRUD Server) completed. All tasks done (including tweak R6-1.TW1 replacing `node:sqlite` with `better-sqlite3` for broader Node.js compatibility), DoD satisfied, full test suite green (531 tests, 87 files).
- 2026-05-18: Phase 2 — Board SPA + blueprint board Command completed. All tasks done, DoD satisfied, full test suite green (688 tests, 110 files).
- 2026-05-18: SRS repair — added MAS-204 (Built-in Task Tracker) and MAS-205 (Local Project Board UI) to `docs/srs.md` (status `approved-pending-implementation`, assigned milestone Revision 6). Revision 6 document had referenced both requirements as created but they were missing from the SRS index; pre-phase repair commit unblocks R6 Phase 3 execution per `phase-planning.md` preconditions. Both transition to `active` in R6 Phase 5.
- 2026-05-18: Revision 6 Phase 3 — Protocol Rewrite was planned and test-planned. Phase document committed at `docs/milestones/revision-6-built-in-tracker/phase-3-protocol-rewrite.md` with Gate R6-3.0 (Tracker Contract Canon) + Stream A (execution-side docs) + Stream B (planning-side docs, featuring the `health-check.md` rewrite for agent-initiated background board boot) + Stream C (project-level + templates mirror, depends on A + B). 26 tasks, 31 tests. Ready for execution.
- 2026-05-18: Revision 6 Phase 3 — Protocol Rewrite completed. All tasks done, DoD satisfied, full test suite green (757 tests, 114 test files).
- 2026-05-18: Revision 6 Phase 4 — Migration & Doctor Integration was planned. Phase document committed at `docs/milestones/revision-6-built-in-tracker/phase-4-migration-doctor-integration.md` with Gate R6-4.0 (Migration Foundation) + Stream A (server-side JSON export hook) + Stream B (pre-R6 migration via composite Doctor repair: create+migrate DB, import from `tasks.export.json` if present, seed `project_meta`, inject `.gitignore` line) + Stream C (schema-currency + DB-integrity audit via read-only DB open) + Stream D (verification, traceability, repo-wide `vibe-kanban` audit). 20 tasks, ~16.75 duration units. Reuses existing `TRACKER_SCHEMA_VERSION` from Phase 1; no new schema-version constant. JSON snapshot contract: bidirectional, atomically written by the server on every mutation, flat `{ tasks, comments, meta }` shape, consumed by Doctor on missing DB. Ready for test planning.
- 2026-05-18: Revision 6 Phase 4 — Migration & Doctor Integration test plan committed. 46 tests across Gate (18) + Stream A (7) + Stream B (8) + Stream C (8) + Stream D (5). 17 of 20 tasks testable; the 3 not-testable tasks are the test-file-authoring tasks (R6-4.A.3, R6-4.B.4, R6-4.C.3) whose coverage is delivered by their sibling implementation tests. Phase document ready for execution.
- 2026-05-18: JSON snapshot contract decided — bidirectional, atomically written by the tracker server on every successful mutation (`POST/PATCH/DELETE` on tasks and comments), consumed by Doctor on missing DB. Shape is flat `{ tasks, comments, meta }` serialized from every table row. Write uses temp-file + atomic rename at `docs/.blueprint/tasks.export.json`. Failures are caught, logged as `[tracker] snapshot write failed`, and never block the HTTP response. Doctor reads the snapshot via `readSnapshot`, validates shape via `assertSnapshot`, and imports via `importSnapshot` under a single transaction (clear + insert).
- 2026-05-18: Revision 6 Phase 4 — Migration & Doctor Integration completed. All tasks done, DoD satisfied, full test suite green (805 tests, 120 files). 4 regression bugs found during phase completion (pre-existing test fixtures lacked tracker DB), all fixed by adding `includeTracker` option to shared test helper.
- 2026-05-18: Identified and fixed [BUG] Board SPA blank screen (post-Phase-4). Root cause: server response envelope mismatch — server returned `{ data: [...] }` (TrackerResult format) but client expected `{ ok: true, data: [...] }` (Result format). Client misinterpreted as bare response, assigned object instead of array to tasks store, causing `.map()` call to fail. Fix: added `ok` field to HTTP responses and updated `RouteResult` type. All tracker tests pass; SPA snapshot tests have pre-existing failures from recent store-passing refactor.
- 2026-05-19: Revision 6 Phase 5 — Milestone Integration, Verification & Cleanup completed. All tasks done, DoD satisfied, full test suite green (869 tests, 126 files).
- 2026-05-19: Revision 6 — Built-in Task Tracker completed. All phases done.

---

## Milestone Overview

| Milestone | Name | Status |
|-----------|------|--------|
| M1 | Project Bootstrap | Complete |
| M2 | Cross-Project Context (Optional Post-MVP) | Not Started |
| M3 | Workflow Visibility Enhancements (Optional Future) | Not Started |

---

## Phase Graph

> Visual history of all phases. Updated by the phase completion
> agent. Use ✓ for complete, ● for in progress, ○ for not started.

```text
M1 — Project Bootstrap
├── Phase 1 — CLI Foundation ✓
├── Phase 2 — Scaffold Engine ✓
├── Phase 3 — Template Integrity ✓
└── Phase 4 — Testing Setup & Release Readiness ✓
R1 — CLI Discoverability & Help
├── Phase 1 — Root Help & Dispatch Contract ✓
├── Phase 2 — Incorrect Command Recovery & Command-Level Guidance ✓
└── Phase 3 — Documentation & Regression Coverage Alignment ✓
R2 — Tweak Contract
└── Phase 1 — Tweak Contract & Template Integration ✓
R3 — SRS Integration
├── Phase 1 — SRS Module & Structural Registration ✓
├── Phase 2 — Alignment & PRD Flow Rework ✓
└── Phase 3 — Planning Module Integration ✓
R4 — Anti-Patterns
├── Phase 1 — Structural & SRS Foundation ✓
├── Phase 2 — Document Updates (Alignment, SRS, Milestone) ✓
├── Phase 3 — Document Updates (Phase, Revision, Git Workflow) ✓
└── Phase 4 — Verification & Cleanup ✓
R5 — Orchestration Protocol
└── Phase 1 — Orchestration Module & Routing Integration ✓
R6 — Built-in Task Tracker
├── Phase 1 — Tracker Core (Schema + CRUD Server) ✓
├── Phase 2 — Board SPA + blueprint board Command ✓
├── Phase 3 — Protocol Rewrite ✓
├── Phase 4 — Migration & Doctor Integration ✓
└── Phase 5 — Milestone Integration, Verification & Cleanup ✓
M2 — Cross-Project Context (Optional Post-MVP)
└── Phase 1 — TBD ○
M3 — Workflow Visibility Enhancements (Optional Future)
└── Phase 1 — TBD ○
```

---

## Pending Revisions

> Track revisions that have been identified but not yet executed.
> The agent should surface these at session start.

_None. Revision 6 — Built-in Task Tracker is complete. Next milestone or revision is TBD._
