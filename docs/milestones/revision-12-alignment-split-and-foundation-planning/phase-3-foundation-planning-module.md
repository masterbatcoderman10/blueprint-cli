# Phase 3 — Foundation Planning Module Plan

**Status**: Planning
**Milestone**: Revision 12 — Alignment Split and Foundation Planning
**Phase ID prefix**: R12-3

---

## Goals

- Rewrite the skill-only Foundation Planning module from the Phase 1 bootstrap stub into the full workflow agents use after Alignment completes.
- Preserve the locked bootstrap boundary: Foundation Planning requires complete alignment setup, reads marker state only, and stops rather than repairing missing setup blocks.
- Define the one-artifact-at-a-time sequence: PRD Stage 1 body, SRS, PRD Stage 2 milestone projection, then `docs/project-progress.md`.
- Require disk drafts, path-and-summary presentation, targeted edits, and explicit user approval before advancing to the next artifact.
- Keep Foundation Planning out of legacy core routing and out of milestone, phase, test-plan, tracker-task, and board-mutating workflows.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 12 Phase 2 — Alignment Setup Split provides the final setup-only Alignment contract and Foundation Planning handoff wording | Pending |

---

## Gate R12-3.0 — Workflow Contract Canon

> Lock the full Foundation Planning workflow contract before authoring detailed artifact steps or regression tests.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-3.0.1 | Rewrite `templates/skills/blueprint/reference/foundation-planning.md` around the full Phase 3 contract: bootstrap-only preconditions, hard-stop failure outcomes, marker read-only rule, required context sources, artifact order, per-artifact approval gate, and explicit non-goals. Remove Phase 1-only "future workflow" placeholder language. | 1.0 | None | Independent |
| R12-3.0.2 | Mirror the updated template source to `skills/blueprint/reference/foundation-planning.md` byte-for-byte and keep the template copy authoritative. | 0.5 | R12-3.0.1 | Dependent |
| R12-3.0.3 | Add doc-contract coverage proving the two Foundation Planning skill files are byte-identical and no longer contain Phase 1 stub language. | 0.5 | R12-3.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] Foundation Planning is described as a complete workflow, not as a reserved Phase 1 placeholder.
- [ ] The module requires complete Alignment setup, empty `docs/project-progress.md`, required setup blocks, and tracker availability before artifact drafting begins.
- [ ] The module states that marker mutation and setup repair belong to Alignment, not Foundation Planning.
- [ ] The template and repo-root skill copies are byte-identical.
- [ ] Regression coverage fails if the module regresses to placeholder/stub language.

---

## Stream A — Artifact Workflow Authoring

> Define the practical artifact-by-artifact workflow agents must follow during Foundation Planning.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-3.A.1 | Add the PRD Stage 1 workflow: load `reference/planning.md` and `reference/plan-prd.md`, interview for product scope only, draft the PRD body to `docs/prd.md`, present path and summary, apply targeted edits, and require explicit approval before SRS begins. | 1.0 | Gate | Dependent |
| R12-3.A.2 | Add the SRS workflow: load `reference/srs.md`, derive stable requirement IDs from approved PRD Stage 1 and direct user Q&A, preserve SRS structure and metadata rules, draft to `docs/srs.md`, and require explicit approval before returning to PRD. | 1.0 | Gate | Dependent |
| R12-3.A.3 | Add the PRD Stage 2 workflow: return to `docs/prd.md`, project milestones from the approved SRS, reference SRS IDs from milestone descriptions, and require explicit approval before progress initialization. | 0.75 | R12-3.A.2 | Dependent |
| R12-3.A.4 | Add the `docs/project-progress.md` workflow: populate the project progress shell last, set the first PRD milestone as pending milestone planning, and state that populated progress unlocks normal Blueprint routing. | 0.75 | R12-3.A.3 | Dependent |

### Stream A Acceptance Criteria

- [ ] Each artifact step names the reference module(s) it loads instead of duplicating PRD or SRS planning rules.
- [ ] The workflow requires a disk draft, path and summary, targeted edit loop, and explicit approval for each artifact.
- [ ] PRD Stage 2 milestones reference SRS IDs and do not create milestone documents.
- [ ] `docs/project-progress.md` is created last and points normal work to milestone planning, not phase execution.

---

## Stream B — Boundary and Stop-State Coverage

> Protect the bootstrap-only boundaries and non-goals that make Foundation Planning distinct from Alignment and normal planning.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-3.B.1 | Add doc-contract tests for Foundation Planning preconditions and stop outcomes: missing tracker, missing setup blocks, incomplete setup blocks, `alignment-required`, populated progress, and markerless empty progress must not proceed to artifact drafting. | 1.0 | Gate | Dependent |
| R12-3.B.2 | Add doc-contract tests for artifact sequencing and review gates: PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress, with no batching and explicit approval before each transition. | 0.75 | Gate | Dependent |
| R12-3.B.3 | Add negative coverage for non-goals: no milestone docs, no phase docs, no test plans, no tracker tasks, no board mutations, no `docs/core/foundation-planning.md`, and no `templates/docs/core/foundation-planning.md`. | 0.75 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] Tests fail if Foundation Planning can be read as a setup repair workflow.
- [ ] Tests fail if artifacts can be batched or reordered.
- [ ] Tests fail if Foundation Planning crosses into milestone, phase, test-planning, tracker, board, or legacy-core surfaces.

---

## Stream C — Cross-Surface Alignment and Regression Cleanup

> Update nearby assertions and documentation surfaces so the complete workflow replaces the Phase 1 reservation cleanly.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-3.C.1 | Update Phase 1 boundary tests or fixtures that intentionally allowed `foundation-planning.md` to say deeper workflow authoring was future Phase 3 work, so they now assert the full workflow contract. | 0.75 | Gate | Dependent |
| R12-3.C.2 | Update release/package and local-skill mirror assertions if their expected snapshots include the Phase 1 stub body rather than byte identity against the authoritative template file. | 0.5 | R12-3.C.1 | Dependent |
| R12-3.C.3 | Update active docs references that describe Foundation Planning as merely reserved or future work, while preserving the rule that legacy root routing does not gain Foundation Planning. | 0.5 | R12-3.C.1 | Dependent |

### Stream C Acceptance Criteria

- [ ] No test or doc surface still treats Foundation Planning as a placeholder after this phase.
- [ ] Skill payload mirror and package verification continue deriving from the authoritative template skill source.
- [ ] Documentation updates do not introduce a legacy Foundation Planning route or core module.

---

## Parallelization Map

```text
Gate R12-3.0 (Workflow Contract Canon) ───────────────────────────────┐
                                                                       │
                 ┌─────────────────────────────────────────────────────┤
                 │                                                     │
Stream A (Artifact Workflow Authoring) ───────────────────────────────►│
Stream B (Boundary and Stop-State Coverage) ──────────────────────────►│
                 │                                                     │
                 └── Stream C (Cross-Surface Alignment)
                     depends on Gate and selected test/doc baselines ─►│
                                                                       │
                                                                       ▼
                                                Phase R12-3 complete
```

---

## Test Plan

> Generated from task analysis. Formal tests are required because this phase turns the reserved Phase 1 Foundation Planning stub into a live bootstrap workflow contract and forward-updates adjacent skill, package, and active-doc surfaces. Tests are written before implementation (TDD) during execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring the existing Revision 12 doc-contract layout). The pure coverage-authoring / fixture-refresh tasks are marked not separately testable; their evidence is the passing suites they create or refresh.

### Gate R12-3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R12-3.0.1.1 | R12-3.0.1 | unit (doc-contract) | Verify both Foundation Planning skill files now describe a complete Phase 3 workflow rather than a reserved Phase 1 placeholder: bootstrap-only preconditions, hard-stop outcomes, marker read-only rule, artifact order, per-artifact approval gates, and explicit non-goals | Template and repo-root copies contain the full live workflow contract and no longer describe deeper workflow authoring as future Phase 3 work |
| T-R12-3.0.1.2 | R12-3.0.1 | unit (doc-contract) | Verify the preconditions / stop matrix is explicit: missing tracker, missing or incomplete `<ProjectConventions>` / `<AgentOrchestration>`, `alignment-required`, populated progress, and markerless empty progress all stop artifact drafting; only `alignment-complete` plus empty progress may proceed | Every forbidden state hard-stops with redirect guidance, and the only allowed bootstrap entry state is alignment-complete plus empty progress |
| T-R12-3.0.1.3 | R12-3.0.1 | unit (doc-contract) | Verify the module names and relies on the required context sources: approved root setup blocks, existing project files, and loaded artifact-specific references (`reference/planning.md`, `reference/plan-prd.md`, `reference/srs.md`) instead of reopening conventions/setup interviewing | Foundation Planning treats setup blocks and existing project files as context, loads the locked planning references, and does not re-ask setup questions unless required blocks are missing or incomplete |
| T-R12-3.0.1.4 | R12-3.0.1 | unit (boundary) | Verify Foundation Planning is read-only with respect to setup state: it does not mutate markers, does not repair setup blocks, does not load `plan-test.md`, and does not cross into milestone, phase, tracker, board, or legacy-core Foundation Planning surfaces | Marker mutation / setup repair stay out of scope, `plan-test.md` is absent, and all listed non-goals are forbidden |
| T-R12-3.0.2.1 | R12-3.0.2 | unit (mirror) | Verify `templates/skills/blueprint/reference/foundation-planning.md` and `skills/blueprint/reference/foundation-planning.md` remain byte-identical after the Phase 3 rewrite | The repo-root skill copy matches the authoritative template copy byte-for-byte |
| — | R12-3.0.3 | — | Not testable as a separate behavior task: this task is the doc-contract test authoring that proves byte identity and removal of Phase 1 stub language; evidence is the passing Gate R12-3.0 suites above. | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R12-3.A.1.1 | R12-3.A.1 | unit (doc-contract) | Verify the PRD Stage 1 step loads `reference/planning.md` and `reference/plan-prd.md`, limits interviewing to product scope, and drafts the Stage 1 body to `docs/prd.md` | The PRD Stage 1 workflow names both modules, keeps the interview scope product-only, and writes to the locked PRD path |
| T-R12-3.A.1.2 | R12-3.A.1 | unit (workflow-gate) | Verify the PRD Stage 1 step requires: write draft to disk, present path and concise summary, apply targeted edits, and get explicit approval before SRS begins | SRS cannot begin until the PRD Stage 1 artifact has been drafted, reviewed, edited if needed, and explicitly approved |
| T-R12-3.A.2.1 | R12-3.A.2 | unit (doc-contract) | Verify the SRS step loads `reference/srs.md`, derives stable requirement IDs from approved PRD Stage 1 plus direct user Q&A, and drafts to `docs/srs.md` without re-running Alignment | The SRS workflow names the SRS module, uses PRD Stage 1 and user Q&A as inputs, preserves stable ID rules, and writes to the locked SRS path |
| T-R12-3.A.2.2 | R12-3.A.2 | unit (workflow-gate) | Verify the SRS artifact also requires path-and-summary presentation, targeted edits, and explicit approval before returning to PRD Stage 2 | PRD Stage 2 cannot begin until the SRS draft has gone through the same gated review loop |
| T-R12-3.A.3.1 | R12-3.A.3 | unit (doc-contract) | Verify PRD Stage 2 returns to `docs/prd.md`, projects milestones from the approved SRS, references SRS IDs from milestone descriptions, and does not create milestone documents | The Phase 3 workflow uses the approved SRS as the source of milestone projection, embeds SRS ID traceability into milestone descriptions, and keeps milestone-document creation for later milestone planning |
| T-R12-3.A.3.2 | R12-3.A.3 | unit (workflow-gate) | Verify the PRD Stage 2 artifact requires write-to-disk, path-and-summary presentation, targeted edits, and explicit approval before `docs/project-progress.md` initialization begins | Project-progress cannot begin until the PRD Stage 2 draft has been written, reviewed, edited if needed, and explicitly approved |
| T-R12-3.A.4.1 | R12-3.A.4 | unit (doc-contract) | Verify `docs/project-progress.md` is populated last, sets the first PRD milestone as the current pending milestone-planning target, and makes populated progress the unlock for normal routing | Project-progress is the final artifact, its current milestone points at the first PRD milestone, current phase remains pending milestone planning, and populated progress is the routing unlock |
| T-R12-3.A.4.2 | R12-3.A.4 | unit (workflow-gate) | Verify the `docs/project-progress.md` artifact also requires write-to-disk, path-and-summary presentation, targeted edits, and explicit approval before Foundation Planning is considered complete | The workflow cannot finish immediately after writing project-progress; the final artifact must go through the same explicit review loop as the first three artifacts |
| T-R12-3.A.4.3 | R12-3.A.4 | unit (boundary) | Verify the project-progress step does not create phase docs, test plans, tracker tasks, or board mutations while finalizing the bootstrap sequence | The workflow finishes at populated `docs/project-progress.md` and still forbids downstream planning/test/tracker side effects |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-3.B.1 | — | Not testable as a separate behavior task: this task is the precondition / stop-outcome doc-contract suite itself; evidence is the passing `T-R12-3.0.1.2` fixture coverage. | — |
| — | R12-3.B.2 | — | Not testable as a separate behavior task: this task is the sequencing and review-gate suite authoring; evidence is the passing `T-R12-3.A.1.2`, `T-R12-3.A.2.2`, `T-R12-3.A.3.2`, and `T-R12-3.A.4.2` assertions that enforce no batching and approval-before-transition behavior. | — |
| — | R12-3.B.3 | — | Not testable as a separate behavior task: this task is the negative-coverage authoring for non-goals and skill-only boundaries; evidence is the passing `T-R12-3.0.1.4`, `T-R12-3.A.3.1`, `T-R12-3.A.4.3`, and `T-R12-3.C.3.2` boundary assertions. | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-3.C.1 | — | Not testable as a separate behavior task: this task is the Phase 1 boundary-suite / fixture refresh that stops allowing placeholder-era wording; evidence is the passing Gate R12-3.0.1 and R12-3.0.2 assertions against the full workflow body. | — |
| T-R12-3.C.2.1 | R12-3.C.2 | unit (mirror-contract) | Verify local-install / package-surface skill assertions treat `reference/foundation-planning.md` as byte identity against the authoritative template body, not as a frozen Phase 1 stub snapshot | Mirror and package checks fail on stub-era drift and pass only on the full Phase 3 body |
| T-R12-3.C.3.1 | R12-3.C.3 | unit (doc-contract) | Verify active docs that mention Foundation Planning now describe it as a live skill-only workflow with artifact order, approval gates, and bootstrap-only boundaries instead of reserved/future-work wording | Active docs stop describing Foundation Planning as deferred work and accurately summarize the current workflow contract |
| T-R12-3.C.3.2 | R12-3.C.3 | unit (boundary) | Verify those doc updates still do not introduce `docs/core/foundation-planning.md`, `templates/docs/core/foundation-planning.md`, or any legacy root route for Foundation Planning | Documentation stays aligned with the skill-only boundary and does not backdoor a legacy-core surface |

### Test Summary

| Component | Total Tasks | Testable | Not Testable | Tests |
|-----------|-------------|----------|--------------|-------|
| Gate R12-3.0 | 3 | 2 | 1 | 5 |
| Stream A | 4 | 4 | 0 | 9 |
| Stream B | 3 | 0 | 3 | 0 |
| Stream C | 3 | 2 | 1 | 3 |
| **Total** | **13** | **8** | **5** | **17** |

---

## Definition of Done

- [ ] Gate acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] Foundation Planning loads existing planning references instead of duplicating their templates.
- [ ] Foundation Planning drafts PRD Stage 1, SRS, PRD Stage 2, and project-progress one artifact at a time with explicit approval gates.
- [ ] Foundation Planning does not mutate alignment markers, repair setup blocks, create milestone docs, create phase docs, create test plans, create tracker tasks, or mutate the board.
- [ ] Template and repo-root `foundation-planning.md` files are byte-identical.
- [ ] Targeted Revision 12 Phase 3 doc-contract and mirror tests pass.
- [ ] No lint errors in files touched by this phase.

---

## Test Scenarios

### Happy Path

- [ ] A freshly aligned skill-mode project with `alignment-complete`, complete setup blocks, tracker present, and empty progress can enter Foundation Planning.
- [ ] Foundation Planning drafts `docs/prd.md` Stage 1 and stops for user approval before touching `docs/srs.md`.
- [ ] After SRS approval, Foundation Planning returns to PRD Stage 2 and adds milestones that reference SRS IDs.
- [ ] After PRD Stage 2 approval, Foundation Planning populates `docs/project-progress.md` with the first PRD milestone pending milestone planning.
- [ ] Once progress is populated, normal Blueprint routing becomes available.

### Edge Cases

- [ ] `alignment-required` stops Foundation Planning and redirects to Alignment.
- [ ] Missing or placeholder `<ProjectConventions>` / `<AgentOrchestration>` stops Foundation Planning without repair.
- [ ] Populated `docs/project-progress.md` blocks Foundation Planning and routes to normal planning/revision workflows.
- [ ] Empty progress with no supported alignment marker stops with repair guidance.
- [ ] Attempts to create milestone docs, phase docs, test plans, tracker tasks, or board mutations during Foundation Planning are forbidden by the module and covered by tests.

---
