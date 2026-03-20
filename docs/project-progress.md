# Project Progress

**Project**: blueprint-cli
**Kanban**: blueprint-cli
**Current Milestone**: Revision 1 — CLI Discoverability & Help (In Progress)
**Current Phase**: Phase 2 — Incorrect Command Recovery & Command-Level Guidance (TBD — pending phase planning)
**Status**: MVP Complete; Revision 1 Phase 1 complete

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
├── Phase 2 — Incorrect Command Recovery & Command-Level Guidance ○
└── Phase 3 — Documentation & Regression Coverage Alignment ○
M2 — Cross-Project Context (Optional Post-MVP)
└── Phase 1 — TBD ○
M3 — Workflow Visibility Enhancements (Optional Future)
└── Phase 1 — TBD ○
```

---

## Pending Revisions

> Track revisions that have been identified but not yet executed.
> The agent should surface these at session start.

- **Revision 1 — CLI Discoverability & Help**
  - **Status:** Phase 1 complete; Phase 2 pending planning
  - **Priority:** Next
  - **Scope:** Revise root CLI discoverability so `blueprint`, root help flags, and incorrect or unrecognized commands produce actionable usage guidance.
  - **Impact:** M1 Phases 1, 3, and 4
  - **Document:** `docs/milestones/revision-1-cli-discoverability/revision-1-cli-discoverability.md`
  - **Active Phase:** Phase 2 — Incorrect Command Recovery & Command-Level Guidance (pending planning)
