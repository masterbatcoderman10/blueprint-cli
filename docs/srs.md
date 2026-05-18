# blueprint-cli - Software Requirements Specification

---

## Purpose

This SRS exists for blueprint-cli to act as the persistent requirement layer between the PRD and later planning documents. It codifies the structural rules, process constraints, and system behaviors.

---

## Requirement Index

| ID | Title | Priority | Status | Assigned Milestone |
|----|-------|----------|--------|--------------------|
| MAS-177 | Flat Requirement Lists in SRS | Must | superseded | M1 |
| MAS-178 | Checklist-style SRS execution | Must | superseded | M1 |
| MAS-200 | Git Execution Workflow Core Module | Must | active | Revision 4 |
| MAS-201 | Hierarchical Requirement Structuring | Must | active | Revision 4 |
| MAS-202 | Progressive Clarification vs Checklist | Must | active | Revision 4 |
| MAS-203 | Agent Orchestration Protocol Module | Must | active | Revision 5 |
| MAS-204 | Built-in Task Tracker | Must | approved-pending-implementation | Revision 6 |
| MAS-205 | Local Project Board UI | Must | approved-pending-implementation | Revision 6 |

---

## Requirements

### Must Have

#### MAS-200 - Git Execution Workflow Core Module

The system must formalize `git-execution-workflow.md` as a core module and enforce constraints against "Stale Status" and "Unupdated Review Notes" anti-patterns.

- The git workflow must be integrated into the core documentation set.
- Agents must adhere to the defined workflow during execution.

#### MAS-201 - Hierarchical Requirement Structuring

The system must ensure that the SRS module (`srs-planning.md`) structurally prevents "Flat Requirement Lists".

- Requirements must be grouped and structured logically rather than listed without hierarchy.

#### MAS-202 - Progressive Clarification vs Checklist

The system must enforce that the SRS is used for progressive clarification rather than as a simplistic task checklist.

- The SRS planning module must constrain agents from treating requirement gathering as a pure checklist exercise without understanding scope and depth.

#### MAS-203 - Agent Orchestration Protocol Module

The system must provide an orchestration protocol module (`docs/core/orchestrate.md`) that turns an agent into an orchestrator capable of executing a fully-planned phase by dispatching parallel subagents per the phase's parallelization map and running each stream's `execute → review → address → rereview` loop independently.

- The protocol must define orchestrator invocation as an opt-in routing intent, leaving `execution.md` as the default direct-execution path.
- The protocol must faithfully consume the parallelization map produced by `phase-planning.md` (gate first; independent streams in parallel; dependent streams wait on named predecessors).
- Each stream's execute-review-address-rereview loop must be independent — one stream finishing execution must trigger its own review immediately, without waiting for slower streams in the same phase.
- The protocol must support both stream-level invocation (single parallel loop) and phase-level invocation (gate + all streams).
- The protocol must reference, not duplicate, existing per-task and per-stream rules defined in `execution.md`, `review.md`, and `git-execution-workflow.md`.
- The module must be scaffolded into new Blueprint projects via `templates/docs/core/orchestrate.md` and registered in Doctor / template-integrity surfaces as a required core file.

#### MAS-204 - Built-in Task Tracker

The system must provide a built-in per-project task tracker that replaces the external `vibe-kanban` MCP dependency, owned end-to-end by the CLI and shipped with the npm package.

- Storage must be a SQLite database at `docs/.blueprint/tasks.db`, provisioned by `blueprint init` and migrated idempotently.
- The schema must support the 5-state task machine (TO-DO, IN-PROGRESS, IN-REVIEW, REWORK, DONE) with a `milestone TEXT NOT NULL` column on the tasks table for grouping and filtering by milestone, and a threaded review-comment surface (severity `MAJOR` | `MINOR`, single-level replies via self-referential `parent_id`).
- A local HTTP CRUD service must expose task and comment operations (`POST/GET/PATCH/DELETE /tasks`, `POST/GET/PATCH/DELETE /tasks/:id/comments`) plus a `GET /project` meta endpoint.
- The service must bind to `127.0.0.1` only on a dynamic port; no network exposure and no authentication is required.
- The canonical forward transition out of REWORK must be `REWORK → IN-PROGRESS → IN-REVIEW`.
- No external service or runtime dependency may be added beyond Node.js built-ins (`node:sqlite` / `better-sqlite3` as confirmed by R6 Phase 1) and the existing `@clack/prompts` runtime dep.

#### MAS-205 - Local Project Board UI

The system must provide a single-page browser UI for the built-in task tracker, served by the local CRUD service and launched via a new `blueprint board` command.

- `blueprint board` must resolve the project root by walking up from cwd to find `docs/.blueprint/`, boot the CRUD server on `127.0.0.1` with a dynamic port, open the SPA in the default browser, and shut down cleanly on SIGINT.
- The SPA contract must match the `blueprint-controls` Paper file artboard `2YY-0` ("Kanban — Board First with Task Detail"), scoped to a single project (no project switcher, no view toggle).
- The board surface must render five columns (TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE) with live count badges, task cards (multi-line title + stream/gate tag chip + task ID), header filters for phase and stream, and the Done-column collapse for the long tail of completed tasks.
- The Task Detail rail must open on task-card click, display the task's status, title, description, and a threaded review-comment thread with `MAJOR` / `MINOR` severity chips, single-level replies, and `+ MAJOR` / `+ MINOR` / `Reply` composer affordances.
- Pre-built SPA assets must ship under `dist/spa/` inside the published npm tarball; consumers must not invoke any build step locally.

### Should Have

_None yet._

### Could Have

_None yet._

### Won't Have

_None yet._

---

## Requirement Metadata

### MAS-177
- Title: Flat Requirement Lists in SRS
- Priority: Must
- Status: superseded
- Assigned milestone: M1
- Source: Revision 3
- Introduced by: Phase Planning
- Supersedes: None
- Superseded by: MAS-201

### MAS-178
- Title: Checklist-style SRS execution
- Priority: Must
- Status: superseded
- Assigned milestone: M1
- Source: Revision 3
- Introduced by: Phase Planning
- Supersedes: None
- Superseded by: MAS-202

### MAS-200
- Title: Git Execution Workflow Core Module
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: None
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

### MAS-201
- Title: Hierarchical Requirement Structuring
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: MAS-177
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

### MAS-202
- Title: Progressive Clarification vs Checklist
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: MAS-178
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

### MAS-203
- Title: Agent Orchestration Protocol Module
- Priority: Must
- Status: active
- Assigned milestone: Revision 5
- Source: Revision 5 Orchestration
- Introduced by: Revision 5
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-17 - Created from Revision 5
- 2026-05-17 - Activated in Revision 5 Phase 1 (Gate R5-1.0)

### MAS-204
- Title: Built-in Task Tracker
- Priority: Must
- Status: approved-pending-implementation
- Assigned milestone: Revision 6
- Source: Revision 6 Built-in Tracker
- Introduced by: Revision 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-17 - Created from Revision 6 (recorded 2026-05-18 via R6 Phase 3 pre-phase SRS repair)
- 2026-05-18 - Deepened by R6 Phase 4: bidirectional JSON snapshot sub-detail — server-side hook writes `tasks.export.json` atomically on every mutation; Doctor imports snapshot on missing DB. Meaning unchanged; ID unchanged.
- 2026-05-18 - Deepened by R6 Phase 5: added `milestone TEXT NOT NULL` column to the tasks-table schema detail for multi-milestone grouping and filtering. Permitted schema-detail deepening per `phase-planning.md`; meaning unchanged; ID unchanged.

### MAS-205
- Title: Local Project Board UI
- Priority: Must
- Status: approved-pending-implementation
- Assigned milestone: Revision 6
- Source: Revision 6 Built-in Tracker
- Introduced by: Revision 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-17 - Created from Revision 6 (recorded 2026-05-18 via R6 Phase 3 pre-phase SRS repair)

---

## Data Schema

### None
