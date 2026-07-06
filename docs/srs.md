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
| MAS-207 | Change-First Tweak Workflow | Must | active | Revision 8 |
| MAS-208 | Skill-Based Agent Surface | Must | active | Revision 11 |
| MAS-209 | Dual-Source Deprecation Path | Must | active | Revision 11 |
| MAS-210 | NPX Skill Install Pathway | Must | active | Revision 11 |
| MAS-211 | Alignment-Complete Command | Must | active | Revision 11 |
| MAS-212 | In-Place Skill Migration Command | Must | active | Revision 11 |

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

- Alignment setup must capture harness capabilities, role defaults, failure escalation, review/phase-completion guidance, user-named skills/MCPs, and project-specific notes in a dedicated `<AgentOrchestration>` block on supported root agent entry-point files.
- `<AgentOrchestration>` may vary by harness or root entry-point file, while `<ProjectConventions>` remains byte-identical across supported root files.
- The setup block records orchestration defaults only; stream spawning policy and execute/review lifecycle ownership remain with `docs/core/orchestrate.md`.
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

#### MAS-208 - Skill-Based Agent Surface

The system must provide a single `blueprint` skill installed into supported project-local skill roots (`.claude/skills/blueprint/` and `.agents/skills/blueprint/`) as the recommended primary agent surface, alongside the existing `.md` core module mode (which remains supported but is deprecated by MAS-209).

- The skill must consist of `SKILL.md` (frontmatter `name` + ironclad-invocation `description`; setup gate; shared-laws reference; intent-keyed commands/routing table mirroring the root `<ModuleRouting>` table for legacy-supported routes, plus the skill-only Foundation Planning route), 20 renamed `reference/*.md` mirrors for legacy `docs/core/*.md` modules (`alignment.md` → `align.md`, `phase-planning.md` → `plan-phase.md`, `milestone-planning.md` → `plan-milestone.md`, `prd-planning.md` → `plan-prd.md`, `test-planning.md` → `plan-test.md`, `bug-resolution.md` → `bug.md`, `execution.md` → `execute.md`, `git-execution-workflow.md` → `commit.md`, `git-review-workflow.md` → `commit-review.md`, `phase-completion.md` → `phase-complete.md`, `revision-planning.md` → `revision.md`, `srs-planning.md` → `srs.md`, `tweak-planning.md` → `tweak.md`), the skill-only `reference/foundation-planning.md`, the shared `reference/anti-patterns.md` laws file, and `scripts/load-context.mjs` for project-state context loading.
- The live skill payload must contain 24 files total: `SKILL.md`, 20 renamed core-module reference mirrors, `reference/foundation-planning.md`, `reference/anti-patterns.md`, and `scripts/load-context.mjs`.
- The setup gate must apply the bootstrap state machine: missing scaffold or tracker -> stop with install/init guidance; empty progress + `alignment-required` -> Alignment only; empty progress + `alignment-complete` -> Foundation Planning only; populated progress + `alignment-required` -> stop normal routing and rerun or repair Alignment (fast-track when `blueprint-origin: legacy-migration` is present); populated progress + no marker -> allow normal routing; empty progress + no marker -> stop with repair guidance.
- The `SKILL.md` frontmatter `description` must use ironclad-invocation phrasing (superpowers-style mandatory invocation) so that any planning, execution, review, tweak, bug, revision, or commit request inside a Blueprint project auto-activates the skill.
- The intent-keyed commands/routing table inside `SKILL.md` must mirror the current legacy root routing table 1:1 where legacy routing still exists. Foundation Planning is routed only from the skill surface and does not create a legacy/core route.
- `reference/*.md` files must carry verbatim content from the corresponding `docs/core/*.md` module body, prepended with skill-style frontmatter (`name`, `description`), except `reference/foundation-planning.md`, which is a skill-only workflow and has no `docs/core` mirror.
- The shared `reference/anti-patterns.md` file must contain only the canonical `<AntiPatterns>` shape spec established by Revision 10 Phase 2 (canonical shape: `<AntiPatterns>` wrapper, `<AntiPattern name="...">` with bare `name=`, required `<BadExample>` + `<Why>`, optional `<GoodExample>` and domain-prefixed variants). `<AntiPatterns>` blocks within `reference/*.md` must conform to this shape.
- `scripts/load-context.mjs` must print a markdown brief to stdout summarising current project state (project name, current milestone, current phase, pending revisions, tracker reachability, and bootstrap marker context).
- `blueprint init` must offer a mode choice with `skill` recommended (default) and `legacy` marked "not recommended"; selecting skill mode must emit the skill payload into `<target>/.claude/skills/blueprint/**` and `<target>/.agents/skills/blueprint/**`, and scaffold skill-mode entry-point variants (CLAUDE.md / AGENTS.md / GEMINI.md / QWEN.md) with split-block placeholders for `<ProjectConventions>` and `<AgentOrchestration>` plus `<!-- blueprint-status: alignment-required -->`; selecting legacy mode must preserve the existing scaffold behaviour unchanged.
- The repo-root `skills/blueprint/**` payload and the authoritative `templates/skills/blueprint/**` surface must remain byte-identical, and the published npm tarball must ship `skills/blueprint/**` for project-local install and release verification.

#### MAS-209 - Dual-Source Deprecation Path

The system must support both skill mode and legacy `.md` core module mode as a transition strategy, with skill mode recommended and legacy mode deprecated but functional. Deprecation must be surfaced consistently through the CLI runtime, the project entry-point files, and the Doctor report, without introducing any forced migration or breaking change for legacy projects.

- Every CLI invocation against a legacy-mode project must emit a one-line deprecation banner to stderr (`[deprecation] consider migrating to skill mode`) before any other output.
- The banner must be suppressed only on root help invocations (`blueprint`, `blueprint --help`, `blueprint -h`). It must still print on `--version`, per-command help (`blueprint <cmd> --help`), `blueprint doctor`, and every other dispatched command — even if the Doctor report already includes a `Mode:` header line introduced by Revision 11 Phase 2.
- Suppression must be controllable per-invocation via a `--no-deprecation-banner` flag and persistently via the `BLUEPRINT_SUPPRESS_DEPRECATION=1` environment variable. The flag must be recognised regardless of position in the argv list and must not interfere with command-level argument parsing.
- Mode detection for banner emission must reuse the canonical `detectProjectMode()` introduced in Revision 11 Phase 2 (`src/doctor/structure.ts`); presence of `.claude/skills/blueprint/SKILL.md` or `.agents/skills/blueprint/SKILL.md` ⇒ skill mode ⇒ no banner.
- `docs/conventions.md` must be deleted from the source repo and from both template mirrors (`templates/conventions.md`, `templates/docs/conventions.md`). The previously scaffolded `conventions.md` shell must be removed from `src/init/archive-engine.ts` shellFiles emission. Doctor's legacy canonical-set must drop `docs/conventions.md`.
- Skill-mode entry-point templates (`templates/skill/CLAUDE.md`, `templates/skill/AGENTS.md`, `templates/skill/GEMINI.md`, `templates/skill/QWEN.md`) must carry a byte-identical `<ProjectConventions>` section containing the migrated content from the sunsetted `conventions.md` (Tech Stack, Libraries & Tools, File Structure, Coding Standards, Testing, Anti-Patterns, Anti-Pattern Block Shape, Agent Tools, Releasing, Project-Specific Notes).
- Legacy-mode entry-point templates (`templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`) must drop the `Load docs/conventions.md` line from `<SessionStart>` STEP 1 and must gain a top-of-file one-line `<DeprecationNote>` block recommending migration to skill mode. They must remain byte-identical to each other (per the existing R10 Phase 1 7-variant block-identity contract; this phase reduces that contract to the legacy-mode variants and extends a parallel one to the skill-mode variants).
- `docs/core/alignment.md` and its template mirror (`templates/docs/core/alignment.md`) must drop every reference to `conventions.md`. The conventions-gathering behaviour must be rewritten to read from and write into the `<ProjectConventions>` section of the project's entry-point file instead of a separate document.
- Mode detection and routing must respect the bootstrap state machine: empty progress + `alignment-required` routes only to Alignment; empty progress + `alignment-complete` routes only to Foundation Planning; populated progress + `alignment-required` blocks normal workflows and reruns Alignment; populated progress + no marker remains a legacy-compatible normal-routing state; empty progress + no marker stops with repair guidance.
- Legacy `.md` core routing must not gain a `Foundation Planning` module or root-table entry. Foundation Planning remains skill-only while legacy/core mode stays supported.
- No automatic in-place migration. `blueprint migrate` is the explicit conversion path and it forces fresh Alignment after conversion.

#### MAS-210 - NPX Skill Install Pathway

The system must support a single primary NPX install pathway for the `blueprint` skill using `vercel-labs/skills`, targeting the canonical project-local `.claude/skills/blueprint/` directory.

- Users must be able to install the skill into a project by running `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`.
- The public GitHub repository must expose the skill payload at repo-root `skills/blueprint/**` so `vercel-labs/skills` can discover it without Blueprint-specific install code.
- `templates/skills/blueprint/**` remains the authoritative scaffold and Doctor source. The repo-root `skills/blueprint/**` payload must be a byte-identical mirror of that authoritative template surface.
- The mirrored repo-root skill payload must include the full 24-file skill surface: `SKILL.md`, 20 renamed `reference/*.md` mirrors, the skill-only `reference/foundation-planning.md`, shared `reference/anti-patterns.md`, and `scripts/load-context.mjs`.
- The published npm tarball must include `skills/blueprint/**` in addition to the existing `dist/` and `templates/` surfaces, and release-artifact verification must fail if the repo-root skill payload is absent or incomplete.
- README, `docs/release-contract.md`, and `docs/releasing.md` must document `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` as the recommended project-local skill install path.
- Documentation must explicitly call out the current `-g` global-install sharp edge in `vercel-labs/skills` and recommend project-local install for Claude Code discovery.
- No bundled fallback installer, `blueprint-skill-install` command, postinstall hook, or alternate npm-bin install surface is introduced in this requirement. A first-party CLI install option is deferred to Revision 11 Phase 6.
- Real GitHub-backed verification of `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` is required as a manual smoke during Phase 4 completion, but it is not part of deterministic automated test coverage.

#### MAS-211 - Alignment-Complete Command

The system must provide a direct `blueprint alignment-complete` CLI command that records completion of Blueprint alignment by updating alignment-status markers in supported root agent entry-point files.

- The command must scan the supported root agent files that exist in the target project (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`).
- For every existing marked supported file, the command must validate required setup blocks before any marker change: `<ProjectConventions>` and `<AgentOrchestration>` must exist, required blocks must not contain `Alignment pending.`, and `<ProjectConventions>` must be byte-identical across marked supported files.
- `<AgentOrchestration>` must exist on every marked supported file, but the command must not enforce internal heading content or byte identity for that block.
- Files with `<!-- blueprint-status: alignment-required -->` must flip to `<!-- blueprint-status: alignment-complete -->` only if all relevant existing files pass validation.
- The command must be idempotent: files already containing `<!-- blueprint-status: alignment-complete -->` are validated, reported as already complete, and left unchanged.
- Files with neither supported marker must be reported as missing an alignment marker with one-line repair guidance, not silently changed.
- Missing supported root agent files must be skipped without error.
- If any relevant existing file fails validation, the command must fail, print warnings naming the file and problem, and flip nothing.
- On success, the command must remove `<!-- blueprint-origin: legacy-migration -->` from processed supported root files.
- The command must fail clearly when run outside a Blueprint project.

#### MAS-212 - In-Place Skill Migration Command

The system must provide a direct `blueprint migrate` CLI command that converts an existing Blueprint project from legacy core-module mode to skill mode in place.

- The command must work on Blueprint projects regardless of their current detected mode and must be safe to rerun.
- The command must install the bundled Blueprint skill payload into the supported project-local skill roots (`.claude/skills/blueprint/**` and `.agents/skills/blueprint/**`), matching the authoritative `templates/skills/blueprint/**` payload.
- The command must convert every supported root agent entry-point file that exists in the target codebase (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`) to the corresponding skill-mode template from `templates/skill/**`, preserving the split-block placeholder contract for `<ProjectConventions>` and `<AgentOrchestration>`.
- Converted supported root agent entry-point files must receive `<!-- blueprint-origin: legacy-migration -->` and `<!-- blueprint-status: alignment-required -->`. Migration must never preserve `alignment-complete`.
- The command must not attempt smart-merge preservation of prior guidance. Old-guidance preservation and repair belong to the follow-up Alignment rerun, with explicit user approval.
- The command must delete the legacy `docs/core/**` tree outright after the skill payload and root entry points are in place. It must not archive `docs/core/**`.
- The command must update or bootstrap `docs/.blueprint/manifest.json` so `managedFiles` matches the supported root agent files that exist in the codebase after migration.
- After migration, Doctor mode detection must report skill mode, the legacy deprecation banner must no longer emit, and bootstrap routing must treat populated progress plus `alignment-required` plus `blueprint-origin: legacy-migration` as fast-track Alignment repair.
- The command must fail clearly when run outside a Blueprint project.

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
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: Alignment now records harness capabilities, role defaults, failure escalation, and user-named skills/MCPs in a dedicated `<AgentOrchestration>` block, while stream spawn policy remains owned by `orchestrate.md`. Meaning unchanged; ID unchanged.

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
- 2026-05-21 - Deepened by Revision 9 Phase 1: added gated workflow endpoints (`POST /tasks/:id/start`, `submit`, `resume`, `approve`, `reject`) with strict source-state enforcement, idempotent no-op semantics, and atomic multi-comment payload on approve/reject. JSON snapshot writes exactly once per gated call after transaction commit. Meaning unchanged; ID unchanged.
- 2026-05-21 - Confirmed unchanged by Revision 9 Phase 2: the tracker HTTP server surface (endpoints, schema, SPA) is not modified by the Phase 2 board-lifecycle changes. Board lifecycle CLI surface (`stop`, `status`, shared lock, duplicate-start refusal) is owned by MAS-205. Meaning unchanged; ID unchanged.

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
- 2026-05-21 - Elaborated by Revision 9 Phase 2: `blueprint board stop` and `blueprint board status` subcommands added; board lock moved to `<git-common-dir>/blueprint-board.lock` (shared lock across worktrees) with `worktree` field; duplicate-start refusal (same or peer worktree) with no browser auto-open; legacy `docs/.blueprint/board.lock` swept on first boot. Meaning unchanged; ID unchanged.

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
- Status: active
- Assigned milestone: Revision 8
- Source: Revision 8 Tweak Revamp and QoL
- Introduced by: Revision 8 Phase 2
- Supersedes: MAS-206
- Superseded by: None

Change log:
- 2026-05-20 - Created from Revision 8 Phase 2 planning. Locked sub-detail bullets added: Tweak Mode anti-ceremony rules, change-first loop (understand → restate → confirm → change → cycle → verify → post-hoc doc), audit-only post-hoc doc shape (Status / Summary of Change / Files Touched / User Acceptance Note), naming convention `tweak-<n>-<slug>.md`, code-change test gate (npm test green AND user approval required; docs-only tweaks exempt), escalation hard-stop (no auto-routing; user decides), anti-patterns list. Status remains `approved-pending-implementation` until Revision 8 Phase 2 completion.
- 2026-05-20 - Transitioned to active. Revision 8 Phase 2 complete: tweak-planning.md rewritten end-to-end for the change-first workflow, templates mirrored byte-for-byte, CLAUDE.md routing updated, doc-contract tests locked, R7 and R2 contract tests updated to MAS-207, tweak-5 marked superseded. Full test suite green (1010 tests).

### MAS-208
- Title: Skill-Based Agent Surface
- Priority: Must
- Status: active
- Assigned milestone: Revision 11
- Source: Revision 11 Skill-Based Agent Surface
- Introduced by: Revision 11 Phase 1
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-24 - Created from Revision 11 Phase 1 planning (pre-phase SRS repair). Locked sub-detail bullets recorded: skill structure (`SKILL.md` + 20 renamed `reference/*.md` mirrors + shared `reference/anti-patterns.md` + `scripts/load-context.mjs`), explicit file-rename map (`alignment.md` → `align.md`, `phase-planning.md` → `plan-phase.md`, etc.), verbatim-content + skill-frontmatter authoring style for reference mirrors, ironclad-invocation frontmatter `description` shape, intent-keyed routing table mirroring root `<ModuleRouting>` 1:1, canonical-shape-spec-only contents for `reference/anti-patterns.md`, markdown-brief stdout shape for `scripts/load-context.mjs`, Phase 1 scope limited to `templates/skills/blueprint/**` (repo-root `skills/blueprint/` deferred to Phase 4), minimal one-liner skill-mode entry-point variants (no `<SessionStart>` / `<HardRules>` / `<ModuleRouting>`), `blueprint init` mode prompt (skill default, legacy marked "not recommended"). Status remains `approved-pending-implementation` until Revision 11 Phase 2 activates the requirement.
- 2026-05-24 - Phase 1 scope extended: `blueprint init` (both modes) writes a hardcoded `<!-- blueprint-status: alignment-required -->` marker into every scaffolded agent entry-point file (CLAUDE / AGENTS / GEMINI / QWEN) after the template copy step; `docs/core/alignment.md` and its template mirror gain a final alignment step instructing the agent to run the deferred `alignment-complete` command which flips the marker to `<!-- blueprint-status: alignment-complete -->`. The `alignment-complete` command itself is deferred to Revision 11 Phase 6 (alongside the planned `migrate` command). Meaning unchanged; ID unchanged.
- 2026-05-25 - Activated by Revision 11 Phase 2. Doctor mode detection, mode-aware canonical-set enforcement, skill-aware repair, and mode header in report implement the dual-source coexistence surface described in this requirement.
- 2026-06-11 - Bug fix: skill-mode init now emits the same Blueprint skill payload into both `.claude/skills/blueprint/**` and `.agents/skills/blueprint/**`; `SKILL.md` setup-gate guidance now points at `scripts/load-context.mjs` relative to the installed skill directory instead of a Claude-specific project path. Meaning clarified; ID unchanged.
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: the skill setup gate now uses the bootstrap state machine; Foundation Planning is a skill-only route; the skill payload and packaged mirror now contain 24 files including `reference/foundation-planning.md`. Meaning unchanged; ID unchanged.

### MAS-209
- Title: Dual-Source Deprecation Path
- Priority: Must
- Status: active
- Assigned milestone: Revision 11
- Source: Revision 11 Skill-Based Agent Surface
- Introduced by: Revision 11 Phase 3
- Supersedes: None
- Superseded by: None

Change log:
- 2026-05-25 - Created from Revision 11 Phase 3 planning (pre-phase SRS repair, per user direction to land SRS updates before phase doc commits rather than as in-phase tasks). Locked sub-detail bullets recorded: CLI deprecation banner content (`[deprecation] consider migrating to skill mode`, stderr, single line, emitted before any other output); banner skip rule (root help only — `blueprint`, `blueprint --help`, `blueprint -h`); banner still prints on `--version`, command-level help, `blueprint doctor`, and all other dispatched commands; suppression surface (`--no-deprecation-banner` flag accepted anywhere in argv; `BLUEPRINT_SUPPRESS_DEPRECATION=1` env var for persistence); mode detection reuses Phase 2 `detectProjectMode()` from `src/doctor/structure.ts` (presence of `.claude/skills/blueprint/SKILL.md` or `.agents/skills/blueprint/SKILL.md` ⇒ skill ⇒ no banner); `docs/conventions.md` deletion across source and both template mirrors plus `src/init/archive-engine.ts` shellFiles cleanup and Doctor legacy canonical-set drop; skill-mode entry-point templates gain byte-identical `<ProjectConventions>` section across CLAUDE / AGENTS / GEMINI / QWEN containing the migrated conventions content; legacy-mode entry-point templates drop the `Load docs/conventions.md` SessionStart line and gain a top-of-file `<DeprecationNote>` block; `docs/core/alignment.md` and its template mirror drop all `conventions.md` references and rewrite conventions-gathering to read/write the `<ProjectConventions>` section of the project entry-point file; no automatic in-place migration (deferred to `blueprint migrate` in Phase 6). Status remains `approved-pending-implementation` until Revision 11 Phase 3 completion.
- 2026-05-26 - Transitioned to active. Revision 11 Phase 3 complete: CLI deprecation banner behavior, conventions sunset, legacy entry-point deprecation notes, skill-mode `<ProjectConventions>` injection, and alignment rewrite were implemented and verified.
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: dual-source routing now preserves the bootstrap state machine, and legacy/core mode does not gain a Foundation Planning route; `blueprint migrate` remains explicit, not automatic. Meaning unchanged; ID unchanged.

### MAS-210
- Title: NPX Skill Install Pathway
- Priority: Must
- Status: active
- Assigned milestone: Revision 11
- Source: Revision 11 Skill-Based Agent Surface
- Introduced by: Revision 11 Phase 4
- Supersedes: None
- Superseded by: None

Change log:
- 2026-06-09 - Created from Revision 11 Phase 4 planning (pre-phase SRS repair, per user direction to land SRS updates before phase doc commits rather than as in-phase tasks). Locked sub-detail bullets recorded: single supported Phase 4 install path is `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`; `vercel-labs/skills` discovery surface is repo-root `skills/blueprint/**`; `templates/skills/blueprint/**` remains authoritative while `skills/blueprint/**` is a byte-identical mirror; the mirrored payload includes 23 files (`SKILL.md`, 20 renamed `reference/*.md`, shared `reference/anti-patterns.md`, `scripts/load-context.mjs`); the npm tarball must ship `skills/blueprint/**` and release verification must enforce it; README and release docs must recommend project-local install and document the current `-g` sharp edge; no bundled fallback installer is included in Phase 4; real GitHub install verification is manual smoke only. Status remains `approved-pending-implementation` until Revision 11 Phase 4 completion.
- 2026-06-09 - Transitioned to active after manual smoke against public ref `r11-4-phase4-smoke` at commit `98e36d81dde09b6ce46693899aed6e43b6216c7d` using `npx skills add masterbatcoderman10/blueprint-cli#r11-4-phase4-smoke --skill blueprint --agent claude-code -y --copy`; verified project-local `.claude/skills/blueprint/` and no unrelated scaffold.
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: the repo-root and packaged skill payload counts increased to 24 files with the addition of the skill-only `reference/foundation-planning.md`. Meaning unchanged; ID unchanged.

### MAS-211
- Title: Alignment-Complete Command
- Priority: Must
- Status: active
- Assigned milestone: Revision 11
- Source: Revision 11 Skill-Based Agent Surface
- Introduced by: Revision 11 Phase 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-07-03 - Created from Revision 11 Phase 6 planning. Locked sub-detail bullets recorded: direct `blueprint alignment-complete` command; scans existing supported root agent files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`); replaces `<!-- blueprint-status: alignment-required -->` with `<!-- blueprint-status: alignment-complete -->`; already-complete files are idempotent no-ops; missing-marker files are reported rather than silently changed; missing supported files are skipped; command fails clearly outside a Blueprint project. Status remains `approved-pending-implementation` until Phase 6 execution activates it.
- 2026-07-03 - Transitioned to active after Revision 11 Phase 6 completion and verification. `blueprint alignment-complete` now ships as the direct marker-flip command for supported root agent files; targeted Phase 6 command/doc-contract tests, full `npm test`, and `npm run release:pack:verify` pass.
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: `alignment-complete` now validates required blocks, byte-identical `<ProjectConventions>`, no-partial-flip behavior, missing-marker reporting, and legacy-migration cleanup before flipping markers. Meaning unchanged; ID unchanged.

### MAS-212
- Title: In-Place Skill Migration Command
- Priority: Must
- Status: active
- Assigned milestone: Revision 11
- Source: Revision 11 Skill-Based Agent Surface
- Introduced by: Revision 11 Phase 6
- Supersedes: None
- Superseded by: None

Change log:
- 2026-07-03 - Created from Revision 11 Phase 6 planning. Locked sub-detail bullets recorded: direct `blueprint migrate` command; works from legacy or skill mode and is safe to rerun; installs bundled skill payload into both `.claude/skills/blueprint/**` and `.agents/skills/blueprint/**`; converts every supported root agent file that exists in the target codebase to its skill-mode template; preserves existing alignment marker state and adds `<!-- blueprint-status: alignment-required -->` when a converted file has no marker; deletes `docs/core/**` outright with no archive; updates or bootstraps `docs/.blueprint/manifest.json` so `managedFiles` matches existing supported root files; post-migration Doctor detects skill mode and the legacy deprecation banner stops; command fails clearly outside a Blueprint project. Status remains `approved-pending-implementation` until Phase 6 execution activates it.
- 2026-07-03 - Transitioned to active after Revision 11 Phase 6 completion and verification. `blueprint migrate` now ships as the in-place legacy-to-skill conversion command; targeted Phase 6 command/doc-contract tests, full `npm test`, and `npm run release:pack:verify` pass.
- 2026-07-06 - Elaborated by Revision 12 Phase 5 audit: `migrate` now forces fresh Alignment, writes `blueprint-origin: legacy-migration` plus `alignment-required`, converts root files to split-block placeholders, and leaves old-guidance preservation to the Alignment rerun. Meaning unchanged; ID unchanged.

---

## Data Schema

### None
