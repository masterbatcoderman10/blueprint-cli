# Revision 12 - Alignment Split and Foundation Planning

**Status:** Pending Phase 1 planning
**Identified:** 2026-07-05
**Owner milestone bucket:** Revision 12 (post-R11)
**Type:** Hybrid - modifying existing alignment, setup gate, migrate, and alignment-complete behavior; additive skill-only Foundation Planning module.
**Planning record:** `docs/milestones/revision-12-alignment-split-and-foundation-planning/revision-planning-q-and-a.md`

---

## 1. What is changing and why

### 1.1 Change

Blueprint's initial project setup flow is split into two explicit sessions:

1. **Alignment** becomes setup-only.
   - Assess the project enough to establish conventions and agent setup.
   - Ask for technical setup with defaults and explicit user confirmation.
   - Write `<ProjectConventions>` and `<AgentOrchestration>` into supported root agent entry points.
   - Run `blueprint alignment-complete`.
   - End with a clear user message to start a fresh session or clear context and run Foundation Planning.

2. **Foundation Planning** becomes a new skill-only workflow.
   - Create the initial PRD, SRS, and `docs/project-progress.md`.
   - Draft artifacts to disk, then present path and summary for user review.
   - Require user approval before moving from one artifact to the next.
   - Avoid milestone document, phase document, test plan, and tracker-task creation.
   - Set the first PRD milestone as pending milestone planning in `docs/project-progress.md`.

The new Foundation Planning module lives only in the skill surface:

- `templates/skills/blueprint/reference/foundation-planning.md`
- `skills/blueprint/reference/foundation-planning.md`

There is no legacy `docs/core/foundation-planning.md`, no `templates/docs/core/foundation-planning.md`, and no legacy root `<ModuleRouting>` row.

Alignment no longer produces or finalizes project planning documents. This removes the current tendency for document production to happen after the agent's context is already saturated by setup and interview work.

### 1.2 Technical setup and orchestration block

Alignment now creates a separate `<AgentOrchestration>` block rather than folding model and harness guidance into `<ProjectConventions>`.

The alignment interview must ask the user, with defaults and confirmation, about:

- Harnesses the project should support, such as Codex, OpenCode, Cursor, Pi, or others the user names.
- Whether each harness supports model selection, effort selection, subagents, skills, and MCPs.
- Role defaults for execution, review, and phase completion.
- Failure-based escalation rules, especially repeated failure on the same stream and repeated review failure.
- Skills or MCPs the user wants considered for planning and execution.

Planning itself does not require subagent model defaults. However, the user may name additional skills whose planning or interviewing criteria should be considered. Blueprint keeps ownership of artifact structure: external skills may influence questioning, critique, or planning judgment, but their document templates are not adopted.

`<AgentOrchestration>` guidance is allowed to differ across root entry-point files when the harness differs. `<ProjectConventions>` must remain byte-identical across marked supported root entry-point files.

### 1.3 Bootstrap and routing behavior

The setup gate changes from a single "progress plus tracker" check into an explicit bootstrap state machine:

```text
No scaffold/tracker
  -> stop and instruct install/init

After init: tracker exists + empty project-progress + alignment-required
  -> route only to Alignment

Empty project-progress + alignment-complete
  -> route only to Foundation Planning

Populated project-progress + alignment-required
  -> block normal workflows as inconsistent or migrated state
  -> rerun Alignment, with fast track when legacy-origin is present

Populated project-progress + no marker
  -> allow normal routing for older projects

Empty project-progress + no marker
  -> stop with repair guidance
```

If the Blueprint skill is invoked before `blueprint init` has run, the agent must stop and instruct the user to install Blueprint if needed and then run `blueprint init`. The skill does not silently self-scaffold.

### 1.4 Migration behavior

`blueprint migrate` changes from "convert and preserve marker state" to "convert and require fresh alignment".

The command should:

- Install the current skill payload.
- Convert existing root agent entry points to skill-mode templates with placeholders.
- Add `<!-- blueprint-origin: legacy-migration -->` to converted root entry points.
- Set converted marked root entry points to `<!-- blueprint-status: alignment-required -->`.
- Never preserve `alignment-complete` after migration.

The command does not attempt to merge existing guidance intelligently. Preservation and correction of old guidance is AI-agent work during the alignment rerun, with explicit user approval.

After migration, a populated `docs/project-progress.md` plus `alignment-required` plus `blueprint-origin: legacy-migration` blocks normal workflow routing and sends the user through a fast-track alignment repair. That fast track skips product/code/git discovery and focuses only on root entry-point setup, preserving old conventions and orchestration guidance where the user approves.

### 1.5 Alignment-complete behavior

`blueprint alignment-complete` remains the command run by the AI after the user has approved alignment edits.

The command validates existing supported root entry-point files before changing anything:

- Supported root files: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`.
- Absent supported files are skipped.
- Files with `alignment-required` are validated and, if all validation passes, flipped to `alignment-complete`.
- Files already at `alignment-complete` are validated and reported as already complete.
- Files with no marker are reported with one-line repair guidance and left unchanged.

Validation is intentionally simple:

- Required blocks exist.
- Required blocks do not contain `Alignment pending.`
- `<ProjectConventions>` is byte-identical across marked supported root entry-point files.
- `<AgentOrchestration>` exists, but its internal headings and byte identity are not command-enforced.

If any relevant existing file fails validation, the command fails, prints warnings naming the file and problem, and flips nothing. The AI fixes the issue and reruns the command. On success, it removes `<!-- blueprint-origin: legacy-migration -->` from processed root entry-point files.

### 1.6 Why

- **Context hygiene.** Alignment currently combines setup, conventions, PRD production, SRS production, milestone setup, and project-progress setup. By the time documents are produced, the agent has too much context pressure and tends to rush.
- **Cleaner mental model.** Alignment answers "how should agents work in this project?" Foundation Planning answers "what are we building and how is the first milestone represented?"
- **Better recovery after migration.** Migration is a disruptive root-surface conversion. Requiring alignment afterward prevents stale conventions or model guidance from silently surviving in a wrong shape.
- **Harness-aware setup.** Agent model selection, effort levels, fallback rules, skills, and MCP guidance belong in an explicit orchestration block that can vary by harness where needed.
- **Skill-first direction.** New workflow investment should land in the Blueprint skill surface, not in legacy core-module routing.

---

## 2. Impact analysis

### 2.1 PRD milestones affected

| Milestone | Affected | Notes |
|-----------|----------|-------|
| M1 - Project Bootstrap | Yes | init, scaffold, Doctor/setup gate, root entry-point templates, release/package skill payload, and command behavior all change |
| M2 - Cross-Project Context | No | not yet started |
| M3 - Workflow Visibility Enhancements | No | not yet started |

### 2.2 Completed phases and revisions affected

| Area | Severity | Reason |
|------|----------|--------|
| M1 Phase 2 - Scaffold Engine | Major | skill-mode root entry-point placeholders and marker shape change |
| M1 Phase 3 - Template Integrity | Major | Doctor/setup gate and canonical skill payload inventory gain Foundation Planning |
| M1 Phase 4 - Testing Setup & Release Readiness | Moderate | release/package verification must include the new skill reference file |
| Revision 3 Phase 2 - Alignment & PRD Flow Rework | Major | alignment stops producing PRD, SRS, milestone, and project-progress artifacts |
| Revision 5 Phase 1 - Orchestration Module & Routing Integration | Moderate | role defaults and model/effort escalation guidance move into `<AgentOrchestration>` without changing spawn policy |
| Revision 11 Phase 1 - Skill Authorship & Mode-Aware Scaffold | Major | skill route table, setup gate, root skill-mode templates, alignment reference, and marker expectations change |
| Revision 11 Phase 2 - Doctor Mode Awareness & Dual-Source Repair | Moderate | skill canonical payload grows and setup-state routing changes |
| Revision 11 Phase 3 - CLI Deprecation Banner & Conventions Sunset | Moderate | `<ProjectConventions>` remains shared while `<AgentOrchestration>` is added separately |
| Revision 11 Phase 4 - NPX Install Pathway & Release Surface | Moderate | repo-root skill payload and package inventory grow from 23 to 24 files |
| Revision 11 Phase 6 - Migrate & Alignment-Complete Commands | Major | both command contracts change |

### 2.3 Files and modules likely affected

#### Skill and reference payload

- `templates/skills/blueprint/SKILL.md`
- `templates/skills/blueprint/reference/align.md`
- `templates/skills/blueprint/reference/foundation-planning.md`
- `skills/blueprint/SKILL.md`
- `skills/blueprint/reference/align.md`
- `skills/blueprint/reference/foundation-planning.md`

#### Root entry-point templates

- `templates/skill/CLAUDE.md`
- `templates/skill/AGENTS.md`
- `templates/skill/GEMINI.md`
- `templates/skill/QWEN.md`
- Existing supported root entry-point files in this repo, if dogfood surfaces are kept current

Legacy entry-point templates are not expanded with Foundation Planning routes. They may still receive compatibility-safe marker or migration wording if needed by command behavior.

#### CLI and Doctor implementation

- `src/doctor/structure.ts`
- `src/doctor/inventory.ts`
- `src/doctor/audit.ts`
- `src/doctor/repair.ts`
- `src/init/archive-engine.ts`
- `src/commands/r11-6-foundation.ts`
- `src/help/command.ts`
- `src/help/implemented-commands.ts`
- `src/release/skill-payload-inventory.ts`
- `src/release/package-artifact.ts`
- `src/release/verify-package-artifact.ts`

#### Documentation and release surfaces

- `README.md`
- `docs/release-contract.md`
- `docs/releasing.md`
- `docs/srs.md`
- `docs/project-progress.md`

### 2.4 Existing tests expected to change

The following test families verify the old behavior and should be updated or replaced during the revision:

- `tests/revision-11/gate/skill-md.test.ts` - route table/setup gate expectations.
- `tests/revision-11/gate-4.0/skill-payload-inventory.test.ts` - exact skill payload file count and path inventory.
- `tests/revision-11/stream-a/skill-payload-mirror-contract.test.ts` - template/repo-root skill mirror file set.
- `tests/revision-11/stream-a/reference-mirrors.test.ts` - reference mirror expectations.
- `tests/revision-11/stream-b/release-package-artifact.test.ts` - packaged skill payload paths.
- `tests/revision-11/stream-b/local-skill-install.test.ts` - local skill payload inventory and mirror validation.
- `tests/revision-11/stream-c/alignment-doc-contract.test.ts` - alignment guidance currently includes document production and old final-step language.
- `tests/revision-11/stream-c/active-command-docs.test.ts` - active docs for `alignment-complete` and `migrate`.
- `tests/revision-11/stream-c/skill-mode-entry-point-stubs.test.ts` - skill-mode root entry-point stub shape.
- `tests/revision-11/stream-d/mode-prompt.test.ts` - init/setup gate copy if bootstrap guidance changes.
- `tests/revision-11/stream-d/scaffold-engine.test.ts` - scaffolded skill-mode entry-point payloads.
- `tests/revision-11/stream-d/alignment-marker.test.ts` - marker placement and placeholder shape.
- `tests/revision-11/stream-a/alignment-complete-command.test.ts` - command validation and marker-flip semantics.
- `tests/revision-11/stream-b/migrate-command.test.ts` - migration marker preservation changes to forced realignment.
- `tests/revision-11/gate/command-foundation.test.ts` - command registration/help surface if copy changes.
- `tests/revision-1/stream-b/command-help-metadata.test.ts` and `tests/stream-a/command-placeholders.test.ts` - implemented command metadata may need copy-only updates.
- `tests/phase-3/gate-3.0/canonical-structure.test.ts`, `tests/revision-3/stream-c/template-registration.test.ts`, `tests/revision-5/stream-a/doctor-structure.test.ts`, and related canonical-count tests - old 20-core and 23-skill assumptions may need forward updates.
- `tests/revision-11/phase-5/progress-bookkeeping.test.ts` - current project-progress completion expectations change when Revision 12 is registered.

New tests should cover:

- setup gate routing for empty/populated progress and marker combinations;
- Foundation Planning skill route and no legacy core route;
- one-artifact-at-a-time Foundation Planning contract;
- `<AgentOrchestration>` placeholder and validation guidance;
- `alignment-complete` block validation and no-partial-flip behavior;
- migration `legacy-origin` marker plus forced `alignment-required`;
- post-migration fast-track routing;
- package/release inventory with 24 skill files.

### 2.5 SRS implications

No new SRS requirement ID is planned. No supersession is planned. Each affected requirement keeps its ID because the revision elaborates setup and workflow mechanics without replacing the user-facing capability.

| ID | Current area | Treatment |
|----|--------------|-----------|
| MAS-203 | Agent Orchestration Protocol Module | Same-ID elaboration. Record role defaults, review/phase-completion model guidance, failure escalation, and the boundary that spawn policy remains owned by orchestration. |
| MAS-208 | Skill-Based Agent Surface | Same-ID elaboration. Add Foundation Planning as a skill-only reference file and route; update skill payload count/inventory. |
| MAS-209 | Dual-Source Deprecation Path | Same-ID elaboration. Record bootstrap setup states and the fact that legacy/core routing does not gain Foundation Planning. |
| MAS-210 | NPX Skill Install Pathway | Same-ID elaboration. Record that the install/package payload includes Foundation Planning. |
| MAS-211 | Alignment-Complete Command | Same-ID elaboration. Record block validation, ProjectConventions identity, AgentOrchestration presence, no partial flips, missing-marker handling, and legacy-origin cleanup. |
| MAS-212 | In-Place Skill Migration Command | Same-ID elaboration. Record forced realignment after migration, legacy-origin marker insertion, AI-driven preservation of old guidance, and fast-track alignment repair. |

SRS updates are revision scope and must be completed during execution, not deferred past the revision.

### 2.6 Conflicts with active or upcoming work

None known. Revision 11 is complete, no other pending revisions were queued when this revision was identified, and no active phase is in progress.

---

## 3. Phases

Per the Blueprint revision-planning anti-pattern, this document does not include gate, stream, or task-level breakdowns. Each phase gets a dedicated phase plan when it is ready to execute.

### Phase 1 - Bootstrap Surface and Skill Payload Contract

Establish the new setup-state contract and skill payload shape.

Scope:

- Add Foundation Planning to the Blueprint skill route table.
- Add `foundation-planning.md` to the authoritative template skill payload and repo-root skill mirror.
- Update Doctor, release, and local-install inventories from 23 to 24 skill payload files.
- Update skill-mode root entry-point templates to include `<ProjectConventions>`, `<AgentOrchestration>`, and `alignment-required` placeholders.
- Clarify bootstrap routing for missing init, empty progress, populated progress, and marker combinations.
- Keep legacy root module routing unchanged for Foundation Planning.

### Phase 2 - Alignment Setup Split

Rewrite alignment as a setup-only workflow.

Scope:

- Remove PRD, SRS, milestone, phase, test-plan, tracker-task, and `project-progress.md` production from alignment.
- Add direct user questioning for conventions and technical setup.
- Add `<AgentOrchestration>` authoring rules with harness capability, role defaults, failure escalation, skills/MCPs, and notes sections.
- Require user confirmation before running `blueprint alignment-complete`.
- End alignment with a plain message telling the user to start a new session or clear context and run Foundation Planning.
- Add the migration/incomplete-alignment fast-track path for populated projects that need root entry-point repair.

### Phase 3 - Foundation Planning Module

Author the new skill-only Foundation Planning workflow.

Scope:

- Load existing Blueprint planning modules instead of duplicating their full content.
- Create the PRD Stage 1 body first.
- Create the SRS second, with direct user Q&A and stable requirement IDs.
- Return to PRD Stage 2 milestone projection third, referencing SRS IDs.
- Create `docs/project-progress.md` last, with the first PRD milestone set as pending milestone planning.
- Draft each artifact to disk, present path and summary, accept targeted edits, and require approval before moving on.
- Do not create milestone documents, phase documents, test plans, or tracker tasks.

### Phase 4 - Command and Migration Semantics

Update the two R11 Phase 6 commands and their user-facing copy.

Scope:

- Change `alignment-complete` to validate supported existing root entry-point files before flipping markers.
- Enforce simple block presence, non-placeholder content, and byte-identical `<ProjectConventions>` across marked files.
- Report but skip missing-marker files.
- Leave absent root entry-point files alone.
- Remove `blueprint-origin: legacy-migration` on successful processing.
- Change `migrate` to convert root entry points to skill-mode placeholders, add `blueprint-origin: legacy-migration`, and always set `alignment-required`.
- Update help output, README/release docs, and active command docs to match the new semantics.

### Phase 5 - SRS, Docs, Verification, and Bookkeeping

Complete cross-surface documentation, requirement traceability, and regression verification.

Scope:

- Apply same-ID SRS change-log entries and text elaborations for MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212.
- Update any active docs or examples that still describe alignment as document production.
- Verify skill payload mirrors, package/release checks, command tests, setup gate tests, and root entry-point contracts.
- Run targeted tests during phase execution and full release verification before completion.
- Update `docs/project-progress.md` when each phase and the revision complete.

### Phase dependency sketch

```text
Phase 1 - Bootstrap Surface and Skill Payload Contract
  -> Phase 2 - Alignment Setup Split
  -> Phase 4 - Command and Migration Semantics
  -> Phase 5 - SRS, Docs, Verification, and Bookkeeping

Phase 1 - Bootstrap Surface and Skill Payload Contract
  -> Phase 3 - Foundation Planning Module
  -> Phase 5 - SRS, Docs, Verification, and Bookkeeping
```

Phase 2 and Phase 3 can be planned after Phase 1 because they share the new skill route and placeholder contract. Phase 4 should wait until the alignment and placeholder contracts are stable. Phase 5 closes the revision after all behavior and documentation has landed.

---

## 4. Success criteria

Revision 12 is complete when all of the following are true:

- Alignment no longer produces PRD, SRS, milestone, phase, test-plan, tracker-task, or `project-progress.md` artifacts.
- Alignment creates or repairs `<ProjectConventions>` and `<AgentOrchestration>` in supported root entry-point files and runs `blueprint alignment-complete` only after user approval.
- Alignment ends by telling the user to start a fresh session or clear context and run Foundation Planning.
- Foundation Planning exists as a skill-only module and is routed from `SKILL.md`.
- Foundation Planning creates PRD, SRS, and `docs/project-progress.md` only, one artifact at a time, with disk drafts and explicit user approval between artifacts.
- Foundation Planning sets the first PRD milestone as pending milestone planning and does not create the milestone document.
- The skill payload inventory, Doctor canonical payload, local skill mirror, and release/package verifier include 24 skill files.
- Skill-mode root entry-point templates contain `<ProjectConventions>`, `<AgentOrchestration>`, and `alignment-required` placeholders.
- Legacy core routing does not gain Foundation Planning.
- The setup gate routes the defined bootstrap states correctly.
- `alignment-complete` validates blocks, avoids partial flips, skips absent files, reports missing-marker files, and removes `blueprint-origin: legacy-migration` after successful processing.
- `migrate` forces realignment by converting root entry points to placeholders with `blueprint-origin: legacy-migration` and `alignment-required`.
- SRS same-ID elaborations are applied for MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212.
- Tests that asserted old behavior are updated to assert the new behavior.
- Targeted revision tests, full `npm test`, and package/release verification pass before revision completion.

---

## 5. Explicit non-goals

- Do not add a legacy `docs/core/foundation-planning.md`.
- Do not add a legacy root `<ModuleRouting>` row for Foundation Planning.
- Do not create handoff documents at the end of alignment.
- Do not have alignment produce PRD, SRS, milestone, phase, test-plan, tracker-task, or project-progress artifacts.
- Do not make Foundation Planning create milestone documents, phase documents, test plans, or tracker tasks.
- Do not add command-level schema enforcement for `<AgentOrchestration>` internal headings.
- Do not make `migrate` intelligently merge old conventions or orchestration guidance.
- Do not scan installed skills or MCPs automatically during alignment; ask the user which ones to consider.
- Do not adopt planning document templates from external skills.
