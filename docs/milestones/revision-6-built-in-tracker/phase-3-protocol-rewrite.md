# Phase 3 — Protocol Rewrite Plan

**Status**: Planning
**Milestone**: Revision 6 — Built-in Task Tracker

---

## Goals

- All Blueprint protocol docs speak the built-in tracker exclusively; every reference to `vibe-kanban`, `kanban MCP`, or `Kanban project` is rewritten or removed.
- A new core module `docs/core/tracker.md` exists as the single source of truth for the tracker contract: storage layout, schema reference, 5-state machine + REWORK transitions, CRUD endpoints with `curl` recipes, lock-file semantics, and the `blueprint board` lifecycle.
- The protocol state machine expands from 4 to 5 states (TO-DO → IN-PROGRESS → IN-REVIEW → REWORK → DONE) with the canonical forward transition from REWORK being `REWORK → IN-PROGRESS → IN-REVIEW`.
- `health-check.md` shifts from "validate MCP reachability" to "validate DB presence and self-provision the local server" — when the DB is present but the HTTP server is unreachable, the agent boots `blueprint board` itself rather than blocking.
- The `**Kanban**:` field in this project's `docs/project-progress.md` and the corresponding template is renamed to `**Tracker**:`.
- All scaffold templates (`templates/docs/core/*.md`, `templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md`, `templates/docs/conventions.md`, `templates/project-progress.md`) mirror the source-doc rewrites so every new `blueprint init` ships with the tracker-only protocol.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| R6 Phase 1 — Tracker Core (schema + CRUD server, `docs/.blueprint/tasks.db`, `node:sqlite` backend) | Complete |
| R6 Phase 2 — Board SPA + `blueprint board` command (server boots on `127.0.0.1`, SPA reachable at `/`) | Complete |
| R5 Phase 1 — Orchestration Module (`docs/core/orchestrate.md` shipped) | Complete |
| **SRS repair** — `docs/srs.md` index + metadata blocks for **MAS-204** and **MAS-205** (revision doc says they were "created alongside this revision document" but the SRS file lists only MAS-200 through MAS-203) | **Pending — blocks Phase 3 execution start.** See Pre-Phase Blocker below. |

---

## Pre-Phase Blocker — SRS Repair

`phase-planning.md` preconditions require the SRS requirement slice assigned to this phase to be loaded. R6's slice is **MAS-204 (Built-in Task Tracker)** and **MAS-205 (Local Project Board UI)**. Neither requirement currently exists in `docs/srs.md`.

Before Phase 3 execution begins:

- Add MAS-204 and MAS-205 rows to the SRS Requirement Index with status `approved-pending-implementation`, priority `Must`, assigned milestone `Revision 6`.
- Add full requirement bodies under **Must Have**.
- Add Requirement Metadata blocks (Title, Priority, Status, Assigned milestone, Source, Introduced by, Supersedes, Superseded by) with a change-log entry dated to the repair commit.

This repair is **out of Phase 3 scope** (it pre-dates the phase per the revision doc). It is tracked here as a blocker so Phase 3 does not start against an incomplete SRS slice. Execute as a standalone repair commit on `main` (or as a tweak on R6-1 if preferred) before moving Phase 3 to In Progress.

---

## SRS Slice

| Requirement | Phase 3 Role |
|-------------|--------------|
| MAS-204 — Built-in Task Tracker | Phase 3 documents the contract (`tracker.md`) and rewrites every protocol consumer to follow it. No new code; consumes the Phase 1 backend. |
| MAS-205 — Local Project Board UI | Phase 3 documents the `blueprint board` lifecycle in `tracker.md` and references it from `health-check.md` (agent-initiated boot). No SPA changes; consumes the Phase 2 artifact. |

No phase-level SRS deepening is expected — Phase 3 is doc-only and does not change the meaning of either requirement. If a meaning change surfaces during execution, escalate per `phase-planning.md` `<PhaseProcess>` ("STOP and flag the discrepancy to the user").

---

## Gate R6-3.0 — Tracker Contract Canon

This gate produces the single source of truth that downstream streams reference. Streams A and B do not start until the gate is in IN-REVIEW.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-3.0.1 | Draft `docs/core/tracker.md` with six sections: (1) Storage location + on-disk layout, (2) Schema reference (links `src/tracker/schema.ts`; does not duplicate DDL), (3) 5-state machine + canonical transitions (incl. `REWORK → IN-PROGRESS → IN-REVIEW`), (4) CRUD endpoints + `curl` recipes for tasks and comments (severity, parent_id threading, cascade), (5) Lock-file semantics (`docs/.blueprint/board.lock` if introduced; otherwise advisory note), (6) `blueprint board` lifecycle (boot, port discovery, agent-initiated background boot, shutdown). | 1.5 | None | Independent |
| R6-3.0.2 | Produce the canonical terminology + snippet table appended to the bottom of `tracker.md` (or in a sibling section) — wording for "tracker", "tracker project id", REWORK label, endpoint paths, and reusable `curl` recipe snippets that Stream A/B docs reference verbatim instead of redefining. | 0.5 | R6-3.0.1 | Dependent |

### Gate R6-3.0 Acceptance Criteria

- [ ] `docs/core/tracker.md` exists with all six required sections present and populated.
- [ ] State machine section documents all five states and names `REWORK → IN-PROGRESS → IN-REVIEW` as the canonical forward transition after review rejection.
- [ ] `curl` recipe snippets cover at minimum: `POST /tasks`, `PATCH /tasks/:id` (state change), `GET /tasks?phase=&stream=`, `POST /tasks/:id/comments` (with severity), `GET /project`.
- [ ] `blueprint board` lifecycle section documents agent-initiated background boot: if `docs/.blueprint/tasks.db` is present but the HTTP server is unreachable, the agent runs `blueprint board` in the background and proceeds (the browser side-effect is noted as benign).
- [ ] Terminology table is finalized and referenced by downstream streams' rewrite tasks.

---

## Stream R6-3.A — Execution-side Docs

> Rewrites the protocol docs that drive day-to-day execution, review, and orchestration. Every kanban reference is replaced; REWORK transitions are inserted where the old protocol stopped at IN-REVIEW.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-3.A.1 | Rewrite `docs/core/execution.md` — replace all "kanban board" wording with tracker references; update state machine to 5 states; insert REWORK pickup semantics in `ApplyReviewNotes`; replace task ops with `tracker.md` `curl` snippets. | 1.5 | Gate | Dependent |
| R6-3.A.2 | Rewrite `docs/core/review.md` — preconditions reference `tracker.md`; rejection path explicitly moves task to REWORK with the canonical transition note. | 0.75 | Gate | Independent |
| R6-3.A.3 | Rewrite `docs/core/git-execution-workflow.md` — wording "moving task to IN-PROGRESS on tracker"; REWORK state transitions documented for commit/branch flow. | 0.5 | Gate | Independent |
| R6-3.A.4 | Rewrite `docs/core/phase-completion.md` — task retrieval via local tracker query; bug-task creation via `POST /tasks` snippet; remove all MCP references. | 0.75 | Gate | Independent |
| R6-3.A.5 | Rewrite `docs/core/bug-resolution.md` — PATH A and PATH B rewritten against the local tracker; reference `tracker.md` recipes. | 1.0 | Gate | Independent |
| R6-3.A.6 | Rewrite `docs/core/orchestrate.md` — orchestrator dispatches against local tracker; per-stream loops use the 5-state machine; REWORK loop semantics documented for the address-rereview cycle. | 1.0 | Gate | Independent |
| R6-3.A.7 | Update any tests asserting protocol text broken by A.1–A.6 (forward-only). Discover via `grep -r -i 'vibe-kanban\|kanban' tests/` minus Phase 2 SPA test results, and `grep -r 'IN-REVIEW' tests/` for state-machine assertions. Patch test fixtures and assertions to match new wording / states. | 0.75 | A.1, A.2, A.3, A.4, A.5, A.6 | Dependent |

### Stream R6-3.A Acceptance Criteria

- [ ] All six source docs in Stream A have zero non-historical hits for `vibe-kanban`, `kanban MCP`, or `Kanban project` (per `grep -i`).
- [ ] Each doc that previously named the 4-state machine names all 5 states and the canonical REWORK transition.
- [ ] `execution.md`, `review.md`, `orchestrate.md` all describe the same REWORK flow (single canonical phrasing from `tracker.md`).
- [ ] `curl` recipes used in execution.md / phase-completion.md / bug-resolution.md are byte-identical to (or link to) the snippets in `tracker.md` §4.
- [ ] Full test suite green after A.7 lands.

---

## Stream R6-3.B — Planning-side Docs

> Rewrites the planning, alignment, and health-check docs. `health-check.md` carries the largest semantic shift in the phase: from "MCP reachability" to "DB present + agent-initiated server provisioning". `alignment.md`'s `KanbanSetup` flow becomes `TrackerSetup`.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-3.B.1 | **Rewrite `docs/core/health-check.md` (featured task).** Replace the operational MCP-reachability check with a two-step tracker check: (a) verify `docs/.blueprint/tasks.db` exists; FAIL → STOP with actionable repair message. (b) verify the HTTP server is reachable on the recorded port (or by probing); if not reachable AND the DB is present, the agent boots `blueprint board` in the background, waits for the server to come up, then continues. Document the boot mechanism inline so the agent does not need to invent it. Rename the `kanban project name` field check to `tracker project id`. | 1.0 | Gate | Dependent |
| R6-3.B.2 | Rewrite `docs/core/alignment.md` — replace the `KanbanSetup` flow with a `TrackerSetup` flow: no external project creation; `init` provisions `tasks.db`; bootstrapping reads project identity from `docs/project-progress.md` rather than an external MCP. | 0.75 | Gate | Independent |
| R6-3.B.3 | Rewrite `docs/core/phase-planning.md` — small wording updates ("Full ID used on tracker, in test IDs"); no structural change. | 0.25 | Gate | Independent |
| R6-3.B.4 | Rewrite `docs/core/tweak-planning.md` — "tracker note" instead of "kanban note"; surface task transitions in tracker terms. | 0.25 | Gate | Independent |
| R6-3.B.5 | Rewrite `docs/core/scope-change.md` — "Create the tracker task per execution.md" (replaces kanban wording). | 0.25 | Gate | Independent |
| R6-3.B.6 | Rewrite `docs/core/blueprint-structure.md` — replace kanban references found via grep (discovered during phase planning; not in original revision doc affected-files table). Audit before rewriting to scope minimal changes. | 0.5 | Gate | Independent |
| R6-3.B.7 | Audit `docs/core/srs-planning.md` for kanban references. Revision doc states "no protocol change" for this file; confirm hits are in examples only and decide rewrite y/n. Patch if needed; otherwise leave with a one-line decision note in the phase doc Tweaks section. | 0.25 | Gate | Independent |
| R6-3.B.8 | Update any tests asserting protocol text broken by B.1–B.7. Same discovery method as A.7. Patch fixtures and assertions to match new wording. | 0.5 | B.1, B.2, B.3, B.4, B.5, B.6, B.7 | Dependent |

### Stream R6-3.B Acceptance Criteria

- [ ] `health-check.md` documents both DB-presence check and agent-initiated background boot of `blueprint board` when the server is unreachable.
- [ ] `alignment.md` no longer references `KanbanSetup`; the `TrackerSetup` flow is internally consistent (no broken cross-references to renamed sections).
- [ ] All six other planning-side docs have zero non-historical kanban hits.
- [ ] `srs-planning.md` audit decision is recorded (rewrite applied OR left alone with rationale).
- [ ] Full test suite green after B.8 lands.

---

## Stream R6-3.C — Project-level Docs + Templates Mirror

> Renames the project-progress field, rewrites project-root files, and mirrors every Stream A and Stream B doc rewrite into `templates/`. Runs only after A and B are fully complete to avoid mirroring stale source content.
>
> **Depends on:** Stream A fully complete (all of A.1–A.7 in DONE) **and** Stream B fully complete (all of B.1–B.8 in DONE).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-3.C.1 | Rewrite `docs/conventions.md` line 57 — remove vibe-kanban; reference the built-in tracker; mention `node:sqlite`; add Svelte dev-dep bullet under Libraries & Tools; preserve "no runtime deps for simple file I/O" rule verbatim. | 0.5 | A.7, B.8 | Dependent |
| R6-3.C.2 | Rewrite project-root `CLAUDE.md` — replace `(vibe-kanban MCP)` wording; if a new `<ModuleRouting>` row for tracker ops is warranted (per Gate canon), add it; otherwise leave routing table alone. | 0.5 | A.7, B.8 | Dependent |
| R6-3.C.3 | Rename `**Kanban**: blueprint-cli` to `**Tracker**: <project-id>` in `docs/project-progress.md`. Project ID value: use the slug expected by the tracker DB (resolve from existing `tasks.db` row or default to project directory name `blueprint-cli`). Update accompanying header comment if present. | 0.25 | A.7, B.8 | Dependent |
| R6-3.C.4 | Mirror Stream A source docs into `templates/docs/core/`: `execution.md`, `review.md`, `git-execution-workflow.md`, `phase-completion.md`, `bug-resolution.md`, `orchestrate.md`. Verbatim port; no edits beyond the source rewrite. | 1.0 | C.1, C.2, C.3 | Dependent |
| R6-3.C.5 | Mirror Stream B source docs into `templates/docs/core/`: `health-check.md`, `alignment.md`, `phase-planning.md`, `tweak-planning.md`, `scope-change.md`, `blueprint-structure.md`, (`srs-planning.md` if B.7 applied changes). | 1.0 | C.1, C.2, C.3 | Dependent |
| R6-3.C.6 | Add `templates/docs/core/tracker.md` mirroring the Gate output. Verbatim port. | 0.25 | C.4, C.5 | Dependent |
| R6-3.C.7 | Mirror `docs/conventions.md` rewrite into `templates/docs/conventions.md`. Rename field in `templates/project-progress.md` (`**Kanban**:` → `**Tracker**:`). | 0.5 | C.1, C.3 | Dependent |
| R6-3.C.8 | Fix line-8 wording in all four templated agent entry points: `templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`. Replace `(vibe-kanban MCP)` with the canonical tracker wording from Gate R6-3.0.2. | 0.25 | C.2 | Dependent |
| R6-3.C.9 | Update template-related tests (e.g., `tests/stream-a/core-templates.test.ts`) to reflect the mirrored template content where assertions break. **Do not** add `tracker.md` to the canonical-core-file list yet — that change is owned by Phase 4 (Doctor canonical-list expansion). If a template test must change to accommodate the existence of the new mirror file without listing it as canonical, do the minimum required. | 0.75 | C.4, C.5, C.6, C.7, C.8 | Dependent |

### Stream R6-3.C Acceptance Criteria

- [ ] `grep -r -i 'vibe-kanban\|kanban MCP\|Kanban project' docs/ templates/ src/` returns zero hits outside `docs/milestones/` history and the project decisions log.
- [ ] `docs/project-progress.md` and `templates/project-progress.md` use `**Tracker**:` field.
- [ ] All 11 (or 12, if B.7 applied) source-doc rewrites are mirrored verbatim under `templates/docs/core/`.
- [ ] `templates/docs/core/tracker.md` matches `docs/core/tracker.md` byte-for-byte (modulo header-only project-name placeholders if any).
- [ ] All four templated agent entry points have the line-8 wording fix applied.
- [ ] Full test suite green after C.9 lands.

---

## Parallelization Map

```
Gate R6-3.0 (Tracker Contract Canon) ──────────┐
                                                │
                 ┌──────────────────────────────┤
                 │                              │
  Stream A (Execution-side docs) ─────────────► │
  Stream B (Planning-side docs)  ─────────────► │
                 │                              │
                 └── Stream C (Project + Templates Mirror)
                     depends on A + B fully complete ─►
                                                │
                                                ▼
                                       Phase 3 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution. Phase 3 is doc-only; tests are file-content
> assertions (Vitest integration tests asserting strings, regex hits,
> and file-mirror equality), plus three `npm test` green-gates after
> the forward-only test-patch tasks (R6-3.A.7, R6-3.B.8, R6-3.C.9).
> Convention precedent: `tests/stream-a/core-templates.test.ts`.

### Gate R6-3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-3.0.1.1 | R6-3.0.1 | integration | `docs/core/tracker.md` contains all 6 required section headers (Storage, Schema reference, State machine, CRUD endpoints + curl recipes, Lock-file semantics, `blueprint board` lifecycle) | All 6 headers present |
| T-R6-3.0.1.2 | R6-3.0.1 | integration | tracker.md state-machine section names all 5 states (TO-DO, IN-PROGRESS, IN-REVIEW, REWORK, DONE) and contains the canonical phrase `REWORK → IN-PROGRESS → IN-REVIEW` | All 5 states + canonical transition present |
| T-R6-3.0.1.3 | R6-3.0.1 | integration | tracker.md contains curl recipes for `POST /tasks`, `PATCH /tasks/:id`, `GET /tasks?phase=&stream=`, `POST /tasks/:id/comments`, `GET /project` | All 5 curl recipes present |
| T-R6-3.0.1.4 | R6-3.0.1 | integration | tracker.md lifecycle section documents agent-initiated background boot of `blueprint board` when server unreachable | Boot semantics phrase present |
| T-R6-3.0.2 | R6-3.0.2 | integration | Terminology + curl-snippet canon table present in tracker.md (covers REWORK label, "tracker project id", endpoint paths, reusable snippets) | Table present with all canon terms |

### Stream R6-3.A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-3.A.1.1 | R6-3.A.1 | integration | `docs/core/execution.md` has zero hits for `vibe-kanban\|kanban MCP\|Kanban project` | 0 matches |
| T-R6-3.A.1.2 | R6-3.A.1 | integration | execution.md ApplyReviewNotes section documents REWORK pickup with canonical transition | Section + transition present |
| T-R6-3.A.2.1 | R6-3.A.2 | integration | `docs/core/review.md` has zero kanban hits | 0 matches |
| T-R6-3.A.2.2 | R6-3.A.2 | integration | review.md rejection path explicitly moves task to REWORK | REWORK referenced in rejection path |
| T-R6-3.A.3.1 | R6-3.A.3 | integration | `docs/core/git-execution-workflow.md` has zero kanban hits | 0 matches |
| T-R6-3.A.3.2 | R6-3.A.3 | integration | git-execution-workflow.md uses "tracker" wording for state transitions and documents REWORK | "tracker" + REWORK present |
| T-R6-3.A.4.1 | R6-3.A.4 | integration | `docs/core/phase-completion.md` has zero kanban hits | 0 matches |
| T-R6-3.A.4.2 | R6-3.A.4 | integration | phase-completion.md references tracker.md curl recipes for task retrieval / bug-task creation | tracker.md reference + recipe usage present |
| T-R6-3.A.5.1 | R6-3.A.5 | integration | `docs/core/bug-resolution.md` has zero kanban hits | 0 matches |
| T-R6-3.A.5.2 | R6-3.A.5 | integration | bug-resolution.md PATH A and PATH B both use tracker recipes | Both paths reference tracker |
| T-R6-3.A.6.1 | R6-3.A.6 | integration | `docs/core/orchestrate.md` has zero kanban hits | 0 matches |
| T-R6-3.A.6.2 | R6-3.A.6 | integration | orchestrate.md per-stream loop documents 5-state machine + REWORK loop | All 5 states + REWORK loop present |
| T-R6-3.A.7 | R6-3.A.7 | integration | `npm test` green after Stream A protocol-text test patches land | Exit code 0 |

### Stream R6-3.B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-3.B.1.1 | R6-3.B.1 | integration | `docs/core/health-check.md` has zero kanban hits | 0 matches |
| T-R6-3.B.1.2 | R6-3.B.1 | integration | health-check.md documents DB-presence check (`tasks.db`) AND agent-initiated background boot of `blueprint board` | Both phrases present |
| T-R6-3.B.1.3 | R6-3.B.1 | integration | health-check.md uses `tracker project id` field name (not `kanban project name`) | New field present, old absent |
| T-R6-3.B.2.1 | R6-3.B.2 | integration | `docs/core/alignment.md` has zero kanban hits | 0 matches |
| T-R6-3.B.2.2 | R6-3.B.2 | integration | alignment.md replaces `KanbanSetup` with `TrackerSetup` flow | TrackerSetup present, KanbanSetup absent |
| T-R6-3.B.3 | R6-3.B.3 | integration | `docs/core/phase-planning.md` has zero kanban hits | 0 matches |
| T-R6-3.B.4 | R6-3.B.4 | integration | `docs/core/tweak-planning.md` has zero kanban hits and uses "tracker note" wording | 0 kanban matches + "tracker note" present |
| T-R6-3.B.5 | R6-3.B.5 | integration | `docs/core/scope-change.md` has zero kanban hits and uses tracker task-creation wording | 0 matches + tracker wording present |
| T-R6-3.B.6 | R6-3.B.6 | integration | `docs/core/blueprint-structure.md` has zero kanban hits | 0 matches |
| — | R6-3.B.7 | — | Not testable: outcome is an audit decision recorded in phase Tweaks section, not a behavior | — |
| T-R6-3.B.8 | R6-3.B.8 | integration | `npm test` green after Stream B protocol-text test patches land | Exit code 0 |

### Stream R6-3.C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R6-3.C.1.1 | R6-3.C.1 | integration | `docs/conventions.md` has zero kanban hits | 0 matches |
| T-R6-3.C.1.2 | R6-3.C.1 | integration | conventions.md mentions built-in tracker, `node:sqlite` (or `better-sqlite3`), and the Svelte dev-dep bullet | All 3 references present |
| T-R6-3.C.1.3 | R6-3.C.1 | integration | conventions.md preserves "no runtime dependencies for simple file I/O tasks" anti-pattern verbatim | Phrase present unchanged |
| T-R6-3.C.2 | R6-3.C.2 | integration | Project-root `CLAUDE.md` has zero kanban hits | 0 matches |
| T-R6-3.C.3 | R6-3.C.3 | integration | `docs/project-progress.md` uses `**Tracker**:` field, not `**Kanban**:` | New field present, old absent |
| T-R6-3.C.4 | R6-3.C.4 | integration | Each of 6 Stream A templates (`templates/docs/core/{execution,review,git-execution-workflow,phase-completion,bug-resolution,orchestrate}.md`) matches its source `docs/core/*.md` byte-for-byte | All 6 mirrors equal source |
| T-R6-3.C.5 | R6-3.C.5 | integration | Each Stream B template under `templates/docs/core/` mirrors its source byte-for-byte (`alignment`, `health-check`, `phase-planning`, `tweak-planning`, `scope-change`, `blueprint-structure`; `srs-planning` if R6-3.B.7 applied changes) | All mirrors equal source |
| T-R6-3.C.6 | R6-3.C.6 | integration | `templates/docs/core/tracker.md` matches `docs/core/tracker.md` byte-for-byte | Mirror equal source |
| T-R6-3.C.7.1 | R6-3.C.7 | integration | `templates/docs/conventions.md` mirrors `docs/conventions.md` byte-for-byte | Mirror equal source |
| T-R6-3.C.7.2 | R6-3.C.7 | integration | `templates/project-progress.md` uses `**Tracker**:` field | New field present |
| T-R6-3.C.8 | R6-3.C.8 | integration | All 4 templated agent entry points (`templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md`) have tracker wording on line 8 (no `vibe-kanban` MCP reference) | All 4 fixed |
| T-R6-3.C.9 | R6-3.C.9 | integration | `npm test` green after Stream C protocol-text + template test patches land | Exit code 0 |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R6-3.0 | 2 | 2 | 0 |
| Stream R6-3.A | 7 | 7 | 0 |
| Stream R6-3.B | 8 | 7 | 1 |
| Stream R6-3.C | 9 | 9 | 0 |
| **Total** | **26** | **25** | **1** |

Total test count: **31** (Gate 5, Stream A 12, Stream B 9, Stream C 12).

---

## Definition of Done

- [ ] Gate R6-3.0 acceptance criteria pass.
- [ ] Stream R6-3.A acceptance criteria pass.
- [ ] Stream R6-3.B acceptance criteria pass.
- [ ] Stream R6-3.C acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] `docs/core/tracker.md` exists and is referenced by execution.md, review.md, phase-completion.md, bug-resolution.md, orchestrate.md, and health-check.md.
- [ ] The 5-state machine + canonical REWORK transition is named consistently across every doc that mentions task states.
- [ ] `health-check.md` documents the agent-initiated background boot of `blueprint board`.
- [ ] `docs/project-progress.md` Field renamed; templates mirror it.
- [ ] All four templated agent entry points have line-8 wording fix.
- [ ] Full test suite green (forward-only updates land in the same stream as the doc rewrite that broke them).
- [ ] No lint errors in files touched by this phase.

---

## Test Scenarios

### Happy Path
- [ ] Agent loads `health-check.md` and sees the DB-presence check + agent-initiated boot, no MCP step.
- [ ] Agent reads `execution.md` and executes a `POST /tasks` `curl` recipe against the local tracker; task appears in the database.
- [ ] Reviewer agent rejects a task per `review.md`; task moves to REWORK. Implementer addresses notes per `execution.md` `ApplyReviewNotes`; task moves REWORK → IN-PROGRESS → IN-REVIEW.
- [ ] `blueprint init` against a fresh directory produces template files where every `templates/docs/core/*.md` reflects the tracker-only protocol (no kanban references).

### Edge Cases
- [ ] Agent reads partially-rewritten state mid-phase (e.g., during Stream A execution): per-stream commit boundaries ensure each stream's commit leaves the docs internally consistent (the gate landed first; A and B finish before C).
- [ ] Template-integrity test asserts a canonical-core-file list that does not yet include `tracker.md` (Phase 4 owns that change) — Stream C.9 must not enlarge the list.
- [ ] `srs-planning.md` audit (B.7) finds substantive references — patch landed in Stream B with a tweak entry; if no patch needed, decision recorded.
- [ ] Server unreachable but DB present: agent boots `blueprint board` in the background, retries connection, proceeds. Documented in `health-check.md`.
- [ ] Server unreachable AND DB missing: `health-check.md` FAILs with the actionable "run `blueprint init` first" message — agent does not silently provision.

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R6-3.TW1), lists affected tasks, and
> includes test impact. See docs/core/tweak-planning.md for the full
> tweak workflow.

_None._

---

## Explicitly Not Changing in Phase 3

| Item | Reason |
|------|--------|
| Doctor canonical-core-file list expansion (adding `tracker.md` as a required canonical file) | Owned by Phase 4 (Doctor Integration). Phase 3 ships `tracker.md` and `templates/docs/core/tracker.md` but does not register them with Doctor. |
| Migration of pre-R6 consumer projects (detecting `**Kanban**:` field or absent `tasks.db` and offering safe migration) | Owned by Phase 4. |
| Final repository-wide `rg -i 'vibe-kanban\|kanban mcp'` audit verifying zero non-historical hits | Verified in Phase 5 (Verification & Cleanup) as part of the cleanup criteria. Each stream's acceptance criteria here verify in-scope files; Phase 5 verifies the whole tree. |
| SRS state transition for MAS-204 / MAS-205 from `approved-pending-implementation` → `active` | Owned by Phase 5. |
| `package.json` `engines.node` bump | Done in Phase 1. |
| `blueprint board --headless` flag or any CLI surface change | Out of scope. `health-check.md` documents the agent boots `blueprint board` as-is (background spawn); the browser-open side-effect is noted as benign. If background-spawn ergonomics prove poor in practice, a CLI flag becomes a separate revision or tweak after Phase 3. |
| PRD changes | The tracker is mechanism, not a product-level goal. |

---
