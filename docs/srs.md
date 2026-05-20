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
| MAS-204 | Built-in Task Tracker | Must | active | Revision 6 |
| MAS-205 | Local Project Board UI | Must | active | Revision 6 |
| MAS-206 | Standalone Tweak Workflow | Must | superseded | Revision 7 |
| MAS-207 | Change-First Tweak Workflow | Must | approved-pending-implementation | Revision 8 |

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
- The protocol must explicitly support bug-task orchestration as stream-like orchestration work when formal orchestration is appropriate.
- Bugs revealed by review or phase completion must be delegated to executor agents, then phase completion must be rerun until clean.

#### MAS-204 - Built-in Task Tracker

The system must provide a built-in per-project task tracker, owned end-to-end by the CLI and shipped with the npm package.

- Storage must be a SQLite database at `docs/.blueprint/tasks.db`, provisioned by `blueprint init` and migrated idempotently.
- The schema must support the 5-state task machine (TO-DO, IN-PROGRESS, IN-REVIEW, REWORK, DONE) with a `milestone TEXT NOT NULL` column on the tasks table for grouping and filtering by milestone, and a threaded review-comment surface (severity `MAJOR` | `MINOR`, single-level replies via self-referential `parent_id`).
- A local HTTP CRUD service must expose task and comment operations (`POST/GET/PATCH/DELETE /tasks`, `POST/GET/PATCH/DELETE /tasks/:id/comments`) plus a `GET /project` meta endpoint.
- The service must bind to `127.0.0.1` only on a dynamic port; no network exposure and no authentication is required.
- The canonical forward transition out of REWORK must be `REWORK → IN-PROGRESS → IN-REVIEW`.
- No external service or runtime dependency may be added beyond Node.js built-ins (`node:sqlite` / `better-sqlite3` as confirmed by R6 Phase 1) and the existing `@clack/prompts` runtime dep.
- Tracker state must be mutated through the local tracker HTTP API, not by raw SQL or direct edits to `docs/.blueprint/tasks.db`.
- Actionable review feedback must be recorded as tracker comments, and implementers addressing feedback should reply to those comments.

#### MAS-205 - Local Project Board UI

The system must provide a single-page browser UI for the built-in task tracker, served by the local CRUD service and launched via a new `blueprint board` command.

- `blueprint board` must resolve the project root by walking up from cwd to find `docs/.blueprint/`, boot the CRUD server on `127.0.0.1` with a dynamic port, open the SPA in the default browser, and shut down cleanly on SIGINT.
- The SPA contract must match the `blueprint-controls` Paper file artboard `2YY-0` ("Kanban — Board First with Task Detail"), scoped to a single project (no project switcher, no view toggle).
- The board surface must render five columns (TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE) with live count badges, task cards (multi-line title + stream/gate tag chip + task ID), header filters for phase and stream, and the Done-column collapse for the long tail of completed tasks.
- The Task Detail rail must open on task-card click, display the task's status, title, description, and a threaded review-comment thread with `MAJOR` / `MINOR` severity chips, single-level replies, and `+ MAJOR` / `+ MINOR` / `Reply` composer affordances.
- Pre-built SPA assets must ship under `dist/spa/` inside the published npm tarball; consumers must not invoke any build step locally.
- The Task Detail rail should open by default to a deterministic task when no valid task hash is present, preserve valid hash-driven selection, and swap immediately to another task when a different card is clicked.

#### MAS-206 - Standalone Tweak Workflow

**Superseded by MAS-207 (Change-First Tweak Workflow) in Revision 8 Phase 2.**

The system must provide a standalone top-level tweak workflow for small, contained changes that should move faster than revisions while preserving Blueprint planning, tracker, review, and verification guards.

- `docs/tweaks/` must be a required Blueprint directory scaffolded into every project, and the **Doctor scaffold integration** must repair the directory and its placeholder `README.md` for older projects missing them, without overwriting any existing user content.
- Each tweak must be planned as a standalone Markdown document under `docs/tweaks/`, named with the locked **naming convention** `tweak-<n>-<slug>.md` (kebab-case slug, monotonically increasing `<n>`).
- Each tweak's tracker tasks must use the locked **tracker milestone value** `Tweak <n> — <name>` (em-dash, human-readable name) for grouping and filtering on the board.
- Tweak documents must use a **lightweight** phase-plan-shaped structure containing exactly: Goals, Dependencies, small Task tables, Acceptance Criteria, Verification, Definition of Done, and Status. No additional formal sections are required.
- Tweak documents must have **no formal test plan section** (this is the "no formal test plan" rule). Needing a formal test plan is an explicit escalation signal that the work belongs in revision or milestone planning, not in a tweak.
- Small additions or modifications may be tweaks when the work is contained and does not create a new feature.
- New features, major edits, regressive changes, cross-cutting contract changes, work needing a formal test plan, or work needing multiple phases must route to revision or milestone planning instead.
- Phase and revision phase templates must not include a `## Tweaks` section.
- Tweak tasks must use the built-in tracker and the normal execution, review, address-notes, rereview, and verification lifecycle. The terminal tweak task may only move to DONE when the full project test suite (`npm test`) is green.

#### MAS-207 - Change-First Tweak Workflow

The system must provide a **change-first tweak workflow** that replaces the tracker-backed MAS-206 workflow. Tweaks move faster and with less ceremony: the agent makes the change first, iterates with the user as the live review loop, and writes a minimal audit-only record after the user approves.

- **Tweak Mode** is the anti-ceremony operating mode the agent enters after classifying a request as a tweak. While Tweak Mode is active, the agent does NOT create tracker/board tasks, does NOT load full planning modules (phase/test/revision/milestone), does NOT subdivide the work into gates or streams, does NOT scaffold a formal test plan, does NOT write a planning artifact in advance of the change, and does NOT re-route through ModuleRouting.
- **Change-first loop**: the agent follows a seven-step loop — understand → restate → confirm → change → cycle → verify → post-hoc doc. No planning artifact is written before the change step.
- **Audit-only post-hoc doc shape**: after the user approves the completed change, the agent writes a minimal post-hoc document under `docs/tweaks/tweak-<n>-<slug>.md` containing exactly four sections: Status, Summary of Change, Files Touched, and User Acceptance Note. No Goals, Dependencies, Tasks, Acceptance Criteria, Verification, or Definition of Done sections.
- **Naming convention** (retained from MAS-206): `tweak-<n>-<slug>.md` with monotonically increasing `<n>`.
- **Code-change test gate**: when the tweak touches code (any file outside `docs/**`), `npm test` must be green AND the user must explicitly approve before the post-hoc document is created. Docs-only tweaks are exempt from the test gate but still require user approval.
- **Escalation hard-stop**: if mid-cycle the work grows beyond a contained change (new feature surface, cross-cutting contract change, multi-phase coordination, formal test plan required, regressive behavior change, multiple distinct concerns), the agent performs a hard stop on Tweak Mode, surfaces the escalation to the user, and waits for the user to decide routing. No automatic rerouting. No partial tweak doc.
- **Anti-patterns** explicitly forbidden in Tweak Mode: creating tracker/board tasks, writing the tweak doc before the change, loading planning modules, carving the tweak into gates/streams/task-tables, drafting a formal test plan, skipping the confirm step, skipping `npm test` for a code-touching tweak, and continuing in Tweak Mode after escalation criteria are met.

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
- 2026-05-20 - Elaborated by Revision 8 planning: bug-task orchestration is a formal stream-like orchestration scope; bugs revealed by review or phase completion must be delegated to executor agents and phase completion rerun until clean. Meaning unchanged; ID unchanged.

### MAS-204
- Title: Built-in Task Tracker
- Priority: Must
- Status: active
- Assigned milestone: Revision 6
- Source: Revision 6 Built-in Tracker
- Introduced by: Revision 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-17 - Created from Revision 6 (recorded 2026-05-18 via R6 Phase 3 pre-phase SRS repair)
- 2026-05-18 - Deepened by R6 Phase 4: bidirectional JSON snapshot sub-detail — server-side hook writes `tasks.export.json` atomically on every mutation; Doctor imports snapshot on missing DB. Meaning unchanged; ID unchanged.
- 2026-05-18 - Deepened by R6 Phase 5: added `milestone TEXT NOT NULL` column to the tasks-table schema detail for multi-milestone grouping and filtering. Permitted schema-detail deepening per `phase-planning.md`; meaning unchanged; ID unchanged.
- 2026-05-19 - Transitioned to active. Phase 5 complete: milestone field, filter, migration, and board rendering all implemented and verified.
- 2026-05-20 - Elaborated by Revision 8 planning: tracker mutation must go through the tracker HTTP API, not raw SQL or direct database edits; actionable review feedback should use tracker comments and replies. Meaning unchanged; ID unchanged.

### MAS-205
- Title: Local Project Board UI
- Priority: Must
- Status: active
- Assigned milestone: Revision 6
- Source: Revision 6 Built-in Tracker
- Introduced by: Revision 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-17 - Created from Revision 6 (recorded 2026-05-18 via R6 Phase 3 pre-phase SRS repair)
- 2026-05-19 - Transitioned to active. Phase 5 complete: local board SPA with milestone filter dropdown and real milestone count rendering implemented and verified.
- 2026-05-20 - Elaborated by Revision 8 planning: task-detail rail opens by default to a deterministic task when no valid hash is present, preserves valid hash-selected tasks, and swaps immediately when another task card is clicked. Meaning unchanged; ID unchanged.

### MAS-206
- Title: Standalone Tweak Workflow
- Priority: Must
- Status: superseded
- Assigned milestone: Revision 7
- Source: Revision 7 Standalone Tweak Workflow
- Introduced by: Revision 7
- Supersedes: None
- Superseded by: MAS-207

Change log:
- 2026-05-19 - Created from Revision 7 planning.
- 2026-05-19 - Deepened by R7 Phase 1 Gate (R7-1.0): locked sub-detail bullets added — naming convention `tweak-<n>-<slug>.md`, tracker milestone value `Tweak <n> — <name>`, lightweight phase-shaped structure, no formal test plan, Doctor scaffold integration for older projects. Status remains `approved-pending-implementation` until phase completion. ID unchanged; meaning unchanged.
- 2026-05-20 - Transitioned to active. Phase 1 complete: standalone tweak workflow implemented, `docs/tweaks/` scaffolded and repaired by Doctor, `tweak-planning.md` rewritten with intent classification and review gates, all core docs and templates updated, R2 inline tweak contract superseded, full test suite green.
- 2026-05-20 - Superseded by MAS-207 (Change-First Tweak Workflow) in Revision 8 Phase 2. The tracker-backed ceremony (pre-change plan, tracker tasks, formal review gate) is replaced by the change-first loop with audit-only post-hoc documentation.

### MAS-207
- Title: Change-First Tweak Workflow
- Priority: Must
- Status: approved-pending-implementation
- Assigned milestone: Revision 8
- Source: Revision 8 Tweak Revamp and QoL
- Introduced by: Revision 8 Phase 2
- Supersedes: MAS-206
- Superseded by: None

Change log:
- 2026-05-20 - Created from Revision 8 Phase 2 planning. Locked sub-detail bullets added: Tweak Mode anti-ceremony rules, change-first loop (understand → restate → confirm → change → cycle → verify → post-hoc doc), audit-only post-hoc doc shape (Status / Summary of Change / Files Touched / User Acceptance Note), naming convention `tweak-<n>-<slug>.md`, code-change test gate (npm test green AND user approval required; docs-only tweaks exempt), escalation hard-stop (no auto-routing; user decides), anti-patterns list. Status remains `approved-pending-implementation` until Revision 8 Phase 2 completion.

---

## Data Schema

### None
