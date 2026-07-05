# Phase 1 — Bootstrap Surface and Skill Payload Contract Plan

**Status**: Planning
**Milestone**: Revision 12 — Alignment Split and Foundation Planning
**Phase ID prefix**: R12-1

---

## Goals

- Establish the Blueprint skill bootstrap-state contract so setup routing can distinguish missing scaffold, empty-progress bootstrap, and populated-project backcompat states without pulling Phase 2 or Phase 4 behavior forward.
- Expand the canonical skill payload from 23 to 24 files by reserving `reference/foundation-planning.md` in the template surface, repo-root mirror, Doctor inventory, and release/package inventory.
- Replace skill-mode root entry-point stubs with placeholder-bearing bootstrap surfaces that include `<ProjectConventions>`, `<AgentOrchestration>`, and the `alignment-required` marker ordering, while forward-updating this repo's live root dogfood files to the split-block surface without forcing them into bootstrap-blocked state.
- Keep legacy root module routing unchanged, add no legacy `docs/core/foundation-planning.md` surface, and defer `alignment-complete` / `migrate` behavior changes to Phase 4 as locked in the Revision 12 Q&A.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 11 Phase 1 — skill payload, setup gate, and `load-context.mjs` baseline | Complete |
| Revision 11 Phase 3 — `<ProjectConventions>` moved into skill-mode root entry points | Complete |
| Revision 11 Phase 4 — repo-root `skills/blueprint/**` mirror and package inventory | Complete |
| Revision 11 Phase 6 — `alignment-complete` / `migrate` commands available as the pre-R12 baseline to preserve until Phase 4 | Complete |
| Revision 12 revision document and planning Q&A artifact | Complete |
| Repo dogfood root entry points (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`) exist and can be forward-updated under the populated-progress + no-marker backcompat rule | Complete |

---

## Gate R12-1.0 — Bootstrap Contract Canon

> Lock the bootstrap-state matrix, establish the Foundation Planning skill surface for the live skill-only workflow, and update the shared canonical-path helpers before downstream mirrors, placeholder entry points, and tests are touched.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-1.0.1 | Rewrite `templates/skills/blueprint/SKILL.md` and `skills/blueprint/SKILL.md` setup-gate and commands/routing sections around the explicit bootstrap state machine: missing scaffold/tracker -> stop with install/init guidance; empty progress + `alignment-required` -> Alignment only; empty progress + `alignment-complete` -> Foundation Planning only; populated progress + `alignment-required` -> block and rerun/repair alignment; populated progress + no marker -> normal routing; empty progress + no marker -> repair guidance. Add a new `Foundation Planning` skill route pointing at `reference/foundation-planning.md` and keep legacy/core routing unchanged. | 1.0 | None | Independent |
| R12-1.0.2 | Author `templates/skills/blueprint/reference/foundation-planning.md` and `skills/blueprint/reference/foundation-planning.md` as the locked Phase 1 bootstrap contract for the live skill-only workflow: preconditions (`alignment-complete`, empty progress, required setup blocks, tracker available), artifact order (`PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress`), one-artifact-at-a-time review with explicit approval between artifacts, and explicit non-goals (no milestone docs, phase docs, test plans, or tracker tasks). Phase 3 later expands the same workflow into the full drafting contract without changing these bootstrap boundaries. | 0.75 | R12-1.0.1 | Dependent |
| R12-1.0.3 | Extend `templates/skills/blueprint/scripts/load-context.mjs` and its repo-root mirror so the context brief reports bootstrap-relevant state without deep parsing: progress shell vs populated progress, alignment marker state across supported root files, presence of `blueprint-origin: legacy-migration`, and tracker reachability, while preserving the current markdown-brief style. | 0.75 | R12-1.0.1 | Dependent |
| R12-1.0.4 | Update shared canonical skill-payload path helpers in `src/doctor/structure.ts` and `src/release/skill-payload-inventory.ts` so `reference/foundation-planning.md` is part of the canonical skill surface and the authoritative payload count moves from 23 to 24. No command semantics change in this gate. | 0.5 | R12-1.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] The Blueprint skill setup gate documents all six bootstrap states and only routes empty-progress bootstrap projects to Alignment or Foundation Planning.
- [ ] `reference/foundation-planning.md` exists in both `templates/skills/blueprint/reference/` and `skills/blueprint/reference/`, and the file states the locked artifact order and non-goals without introducing legacy `docs/core` parity.
- [ ] The context brief can distinguish empty-progress bootstrap from populated-progress backcompat and can surface alignment-marker and legacy-origin state to the agent.
- [ ] Shared canonical skill-payload helpers and release inventory derive a 24-file skill surface that includes `reference/foundation-planning.md`.
- [ ] Legacy root `<ModuleRouting>` surfaces do not gain a Foundation Planning row in this phase.

---

## Stream A — Payload Mirrors, Doctor, and Release Surface

> Propagate the new skill file through the repo-root mirror, Doctor/release inventories, and all 23-file regression surfaces.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-1.A.1 | Add `reference/foundation-planning.md` to the repo-root skill payload mirror and any shared helper/path-list utilities that assert template-to-repo-root skill parity, keeping the template surface authoritative. | 0.5 | Gate | Dependent |
| R12-1.A.2 | Forward-update release/package/local-install surfaces that currently assert a 23-file skill payload (`tests/revision-11/gate-4.0/skill-payload-inventory.test.ts`, `tests/revision-11/stream-b/release-package-artifact.test.ts`, `tests/revision-11/stream-b/local-skill-install.test.ts`, related package-surface helpers) so they assert 24 files and the presence of `reference/foundation-planning.md`. | 0.75 | R12-1.A.1 | Dependent |
| R12-1.A.3 | Forward-update Doctor/canonical-skill tests and any count-sensitive helpers that derive the skill payload from `getSkillCanonicalFiles(...)` so the new file is enforced in template, repo-root, and packaged inventories without changing legacy `docs/core/**` enforcement. | 0.75 | R12-1.0.4, R12-1.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] Template skill payload, repo-root skill payload, and packaged skill payload all enumerate the same 24 files.
- [ ] The new file path is enforced by the same shared path derivation used by Doctor and release inventory code, rather than by hardcoded divergent lists.
- [ ] Local skill install and package-surface regression tests fail if `reference/foundation-planning.md` is missing, drifted, or extra-file alignment breaks.
- [ ] Legacy canonical core-file inventories remain unchanged in this phase.

---

## Stream B — Placeholder Entry Points and Dogfood Root Surface

> Replace minimal skill-mode stubs with placeholder-bearing bootstrap entry points, then forward-update the repo's live root files to the new split-block surface while intentionally preserving populated-project backcompat.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-1.B.1 | Rewrite `templates/skill/CLAUDE.md`, `templates/skill/AGENTS.md`, `templates/skill/GEMINI.md`, and `templates/skill/QWEN.md` from minimal stubs into byte-identical bootstrap placeholders containing, in order: the existing intro text, `<ProjectConventions>` placeholder content, `<AgentOrchestration>` placeholder content, and trailing `<!-- blueprint-status: alignment-required -->`. Add or reuse shared snippet assets if needed, but do not change legacy root templates. | 1.0 | Gate | Dependent |
| R12-1.B.2 | Forward-update this repo's live root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` to the split-block surface with real current `<ProjectConventions>` content and initial `<AgentOrchestration>` guidance, while intentionally leaving them markerless so the populated-progress + no-marker backcompat route remains valid until Phase 4 changes command semantics and bootstrap enforcement. | 1.0 | R12-1.B.1 | Dependent |
| R12-1.B.3 | Replace the current minimal-stub regression coverage with placeholder-surface coverage: template files must contain both blocks, the marker must be last, placeholders must be byte-identical across all four skill templates, legacy templates must remain placeholder-free, and the live root dogfood files must stay compatible with the populated-progress + no-marker backcompat path. | 0.75 | R12-1.B.1, R12-1.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] All four skill-mode template entry points share the same placeholder contract and present the marker after `<ProjectConventions>` and `<AgentOrchestration>`.
- [ ] Legacy root templates remain unchanged with respect to placeholder blocks in this phase.
- [ ] The repo's live root entry points expose the split-block surface needed for later dogfood work but do not introduce `alignment-required` markers that would block normal routing in this already-populated project.
- [ ] Regression coverage protects template placeholder order, shared placeholder content, and the repo-root backcompat exception.

---

## Stream C — Bootstrap Routing and Context Regression Coverage

> Add the forward-only tests that pin the new bootstrap routing matrix, context-brief signals, and Phase 1 boundaries.
> **Depends on:** Stream A (payload inventories) and Stream B (entry-point surface).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-1.C.1 | Add setup-gate doc-contract coverage for the six bootstrap states, Foundation Planning skill-only routing, and the explicit rule that legacy/core routing does not gain a Foundation Planning row. | 0.75 | A.3, B.3 | Dependent |
| R12-1.C.2 | Extend `load-context.mjs` regression tests to cover empty shell vs populated progress, supported-root marker detection, `blueprint-origin: legacy-migration` reporting, and stable markdown-brief ordering for bootstrap-state output. | 0.75 | R12-1.0.3 | Dependent |
| R12-1.C.3 | Add negative contract coverage that Phase 1 does not change `alignment-complete` or `migrate` help/runtime semantics yet, does not introduce `docs/core/foundation-planning.md` or `templates/docs/core/foundation-planning.md`, and does not add a legacy root `<ModuleRouting>` row for Foundation Planning. | 0.5 | R12-1.C.1 | Dependent |

### Stream C Acceptance Criteria

- [ ] Regression tests pin the bootstrap-state matrix and fail if the skill route table regresses to the old "populated progress required" setup gate.
- [ ] `load-context.mjs` tests distinguish empty bootstrap shells from populated progress and surface marker/origin state without losing the markdown brief contract.
- [ ] Negative coverage protects all three locked Phase 1 boundaries: no legacy core module, no legacy routing row, and no premature command-semantic rewrite.

---

## Parallelization Map

```text
Gate R12-1.0 (Bootstrap Contract Canon) ───────────────────────────────┐
                                                                        │
                 ┌──────────────────────────────────────────────────────┤
                 │                                                      │
Stream A (Payload Mirrors, Doctor, Release Surface) ──────────────────► │
Stream B (Placeholder Entry Points and Dogfood Surface) ──────────────► │
                 │                                                      │
                 └── Stream C (Bootstrap Routing and Context Tests)
                     depends on A + B ─────────────────────────────────►│
                                                                        │
                                                                        ▼
                                                          Phase R12-1 complete
```

---

## Test Plan

> Generated from task analysis. Formal tests are required for this phase because it changes bootstrap routing, scaffold output, skill-payload inventory, and context-brief behavior. Tests are written before implementation (TDD) during task execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/`). Only the pure coverage-authoring tasks R12-1.C.1 and R12-1.C.2 are marked not separately testable; their evidence is the passing regression suites they introduce or extend.

### Gate R12-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R12-1.0.1.1 | R12-1.0.1 | unit (doc-contract) | Verify template and repo-root `SKILL.md` setup-gate text enumerates the six bootstrap states with the correct stop or route outcome for each | Both skill copies describe install/init stop, Alignment-only, Foundation Planning-only, populated+required block/rerun, populated+no-marker normal routing, and empty+no-marker repair guidance |
| T-R12-1.0.1.2 | R12-1.0.1 | unit (doc-contract) | Verify the skill routing table adds `Foundation Planning` -> `reference/foundation-planning.md` only on the skill surface and keeps legacy/core routing unchanged | The new row exists exactly once in skill `SKILL.md`; no legacy `docs/core` module or legacy root route is introduced |
| T-R12-1.0.2.1 | R12-1.0.2 | unit (doc-contract) | Verify both `reference/foundation-planning.md` files exist and lock the required preconditions: `alignment-complete`, empty progress shell, required setup blocks, and tracker availability | Template and repo-root copies contain the same precondition contract |
| T-R12-1.0.2.2 | R12-1.0.2 | unit (doc-contract) | Verify both `reference/foundation-planning.md` files lock artifact order, one-artifact-at-a-time review, and the explicit non-goals | Both copies state `PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress`, require review between artifacts, and forbid milestone docs, phase docs, test plans, and tracker tasks |
| T-R12-1.0.3.1 | R12-1.0.3 | integration | Run `load-context.mjs` against fixtures representing empty-progress shell and populated progress, with and without tracker state | The markdown brief distinguishes shell vs populated progress, reports tracker reachability, and keeps section ordering stable |
| T-R12-1.0.3.2 | R12-1.0.3 | integration | Run `load-context.mjs` against fixtures covering supported-root marker states and `blueprint-origin: legacy-migration` | Output reports marker state per supported root and surfaces legacy-origin distinctly from markerless backcompat |
| T-R12-1.0.4.1 | R12-1.0.4 | unit | Verify `getSkillCanonicalFiles(...)`, template/repo-root path helpers, and `SKILL_PAYLOAD_INVENTORY` derive a 24-file skill payload containing `reference/foundation-planning.md` | All derived path lists agree and the authoritative skill payload count is 24 |
| T-R12-1.0.4.2 | R12-1.0.4 | unit | Verify the skill-payload expansion does not alter legacy `docs/core/**` canonical-file expectations | Skill inventory grows to 24 while legacy core required-structure and path expectations remain unchanged |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R12-1.A.1.1 | R12-1.A.1 | unit | Verify the repo-root `skills/blueprint/**` mirror includes `reference/foundation-planning.md` and remains byte-identical to `templates/skills/blueprint/**` | The new file exists in both roots and the mirror stays byte-identical |
| T-R12-1.A.1.2 | R12-1.A.1 | unit | Parameterize missing, drifted, and extra-file mirror fixtures around `reference/foundation-planning.md` | Mirror-contract assertions fail for missing, drifted, or extra new-file cases |
| T-R12-1.A.2.1 | R12-1.A.2 | unit (test-contract) | Verify release, package-artifact, and local-install assertions derive the expected 24-file skill surface from the shared inventory instead of a hardcoded 23-file list | Inventory, package, and local-install helpers stay aligned on the 24-file contract and the new path is covered automatically |
| T-R12-1.A.2.2 | R12-1.A.2 | integration (negative fixture) | In local-install and packed-artifact fixtures, omit or drift only `reference/foundation-planning.md` and run the relevant assertion helpers | Both local-install and package verification fail with file-specific diagnostics for the new path |
| T-R12-1.A.3.1 | R12-1.A.3 | unit (test-contract) | Verify Doctor/canonical-skill assertions derive template, repo-root, and packaged skill file sets from `getSkillCanonicalFiles(...)` | Count-sensitive helpers and assertion surfaces stay tied to the shared canonical file list |
| T-R12-1.A.3.2 | R12-1.A.3 | unit (repair-fixture) | Create skill-mode Doctor fixtures missing or drifting `reference/foundation-planning.md` while leaving legacy `docs/core/**` surfaces untouched | Missing skill files plan a create-from-template repair, drifted skill files are reported without destructive replacement, and legacy-mode expectations remain unchanged |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R12-1.B.1.1 | R12-1.B.1 | unit | Verify `templates/skill/CLAUDE.md`, `templates/skill/AGENTS.md`, `templates/skill/GEMINI.md`, and `templates/skill/QWEN.md` are byte-identical bootstrap placeholders containing intro text, `<ProjectConventions>`, `<AgentOrchestration>`, then the trailing `alignment-required` marker | All four supported entry-point files match byte-for-byte and the marker is the last line |
| T-R12-1.B.1.2 | R12-1.B.1 | unit | Verify the placeholder templates contain no live blueprint-cli-specific conventions/orchestration content and legacy top-level templates stay placeholder-free | Skill-mode templates stay generic and legacy templates do not gain the new blocks |
| T-R12-1.B.2.1 | R12-1.B.2 | unit | Verify repo-root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` contain real `<ProjectConventions>` and `<AgentOrchestration>` blocks for dogfood use | Each live root file exposes both blocks |
| T-R12-1.B.2.2 | R12-1.B.2 | unit (doc-contract) | Verify the repo-root dogfood files remain markerless and therefore compatible with the populated-progress + no-marker backcompat rule | No live root file contains `alignment-required` or `alignment-complete`, and the skill setup-gate contract still treats that state as normal routing |
| T-R12-1.B.3.1 | R12-1.B.3 | integration | Run `copySkillModeAgentStubs` or a full skill-mode scaffold in a temporary fixture over the four supported root files | Generated root files contain both placeholder blocks exactly once and end with a single trailing `alignment-required` marker |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-1.C.1 | — | Not testable as separate automated coverage: this task is the setup-gate doc-contract suite update; evidence is the passing bootstrap-state and route-table assertions introduced for Gate R12-1.0.1. | — |
| — | R12-1.C.2 | — | Not testable as separate automated coverage: this task is the `load-context.mjs` regression-suite update; evidence is the passing fixture-based script assertions introduced for Gate R12-1.0.3. | — |
| T-R12-1.C.3.1 | R12-1.C.3 | unit (doc-contract) | Verify the negative Phase 1 boundary coverage asserts no `docs/core/foundation-planning.md`, no `templates/docs/core/foundation-planning.md`, no legacy root Foundation Planning route, and unchanged `alignment-complete` / `migrate` help-runtime semantics | Phase 1 cannot silently introduce legacy surfaces or pull Phase 4 command semantics forward |

### Test Summary

| Component | Total Tasks | Testable | Not Testable | Tests |
|-----------|-------------|----------|--------------|-------|
| Gate R12-1.0 | 4 | 4 | 0 | 8 |
| Stream A | 3 | 3 | 0 | 6 |
| Stream B | 3 | 3 | 0 | 5 |
| Stream C | 3 | 1 | 2 | 1 |
| **Total** | **13** | **11** | **2** | **20** |

---

## Definition of Done

- [ ] Gate R12-1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] Full test suite is green (`npm test`).
- [ ] `npm run release:pack:verify` is green after the 24-file payload update.
- [ ] The canonical skill payload is 24 files in template, repo-root, Doctor, local-install, and package/release surfaces.
- [ ] Foundation Planning exists only as a skill-surface file in this phase. No `docs/core/foundation-planning.md`, no `templates/docs/core/foundation-planning.md`, and no legacy root route are introduced.
- [ ] Skill-mode template entry points carry `<ProjectConventions>`, `<AgentOrchestration>`, and trailing `alignment-required` placeholder ordering.
- [ ] The repo's live root dogfood files are updated to the split-block surface without entering the bootstrap-blocked state.
- [ ] `alignment-complete` and `migrate` behavior remain at the Revision 11 baseline until Phase 4.
- [ ] No lint errors in files touched by this phase.

---

## Test Scenarios

> High-level supplement to the formal Test Plan above.

### Happy Path

- [ ] A freshly initialized skill-mode project with tracker present, empty `docs/project-progress.md`, and `alignment-required` entry-point markers routes only to Alignment.
- [ ] After alignment flips the marker to `alignment-complete` while progress remains empty, the setup gate routes only to Foundation Planning.
- [ ] Template skill payload, repo-root mirror, and packaged skill payload all include `reference/foundation-planning.md` and agree on a 24-file surface.
- [ ] Skill-mode template entry points render the intro text, placeholder `<ProjectConventions>`, placeholder `<AgentOrchestration>`, then the `alignment-required` marker in that order.
- [ ] This repo's populated project with markerless live root files continues to route normal Blueprint workflows under the backcompat rule.

### Edge Cases

- [ ] Missing scaffold or tracker DB stops the setup gate with install/init guidance rather than routing to Alignment or Foundation Planning.
- [ ] Empty progress plus no alignment marker stops with repair guidance instead of silently choosing a workflow.
- [ ] Populated progress plus `alignment-required` is treated as inconsistent and blocks normal workflow routing.
- [ ] `load-context.mjs` reports legacy-migration origin when present and distinguishes that case from ordinary markerless backcompat.
- [ ] No legacy `docs/core` Foundation Planning module, no template-core mirror, and no legacy root route are introduced by mistake.
- [ ] `alignment-complete` and `migrate` help/runtime copy remain unchanged in this phase even though the bootstrap contract around them has been expanded.

---
