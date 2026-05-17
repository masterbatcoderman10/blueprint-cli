# Phase 1 — Orchestration Module & Routing Integration Plan

**Status**: Planning
**Revision**: Revision 5 — Orchestration Protocol
**Task ID Prefix**: R5-1

---

## Goals

- Blueprint gains a first-class orchestration protocol module that turns an agent into a phase or stream orchestrator without rewriting the underlying execution and review workflows
- Orchestration semantics are explicit for dependency satisfaction, conditional rereview loops, failure classification, escalation, and blocked downstream streams
- Phase-level orchestration automatically runs phase completion as its final sub-step after all streams close out
- The review subagent carries out branch merge and worktree cleanup as part of its final clean review / rereview pass
- All live and templated agent entry points can route orchestration intent to the new module
- Doctor and template-integrity surfaces recognize `orchestrate.md` as a required canonical core file
- MAS-203 becomes active once the module and its integration surfaces are in place

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 5 document defines orchestration as a single-phase additive revision | Complete |
| M1 Phase 2 — Scaffold Engine (template propagation surface exists) | Complete |
| M1 Phase 3 — Template Integrity (Doctor inventory and drift enforcement exist) | Complete |
| M1 Phase 4 — Testing & Release Readiness (test harness and verification flows exist) | Complete |
| Root agent files `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` exist in the current project and templates | Confirmed |
| MAS-203 exists in `docs/srs.md` with status `approved-pending-implementation` | Confirmed |

---

## Gate R5-1.0 — Orchestration Contract Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R5-1.0.1 | Create live `docs/core/orchestrate.md` defining orchestrator invocation, gate-first dispatch, map-faithful stream spawning, stream-vs-phase scope, conditional `review → address → rereview` chaining, dependency completion rules, failure classification, escalation behavior, blocked dependent streams, phase completion as final sub-step, review-subagent merge responsibility, and boundaries with `execution.md`, `review.md`, and git workflow modules | 1.5 | None | Independent |
| R5-1.0.2 | Create `templates/docs/core/orchestrate.md` as the scaffolded copy of the live orchestration module | 0.25 | R5-1.0.1 | Dependent |
| R5-1.0.3 | Update `docs/srs.md` so MAS-203 moves from `approved-pending-implementation` to `active` and records this phase as the activation point | 0.25 | R5-1.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/orchestrate.md` defines an opt-in orchestration role rather than replacing direct execution
- [ ] The live orchestration module states that a dependent stream becomes eligible only after its prerequisite stream finishes clean review closeout (including merge and worktree cleanup by the review subagent), any needed rereview loop, and task completion
- [ ] The live orchestration module defines institutional failures as report-and-stop events for that subagent path and defines competence failures as escalation candidates
- [ ] The live orchestration module defines that review agents should use higher effort than execution agents when the harness supports it
- [ ] The live orchestration module defines model escalation after two similar review failures when the harness supports it, and fallback reporting when the harness does not
- [ ] `templates/docs/core/orchestrate.md` matches the live module exactly
- [ ] The live orchestration module defines phase completion (`phase-completion.md`) as the automatic final sub-step of phase-level orchestration, delegated to an independent phase-completion subagent
- [ ] The live orchestration module defines a `<PhaseCompletionLoop>` that re-runs phase completion after bug tasks are resolved, repeating until the suite passes or the user stops the loop
- [ ] The live orchestration module clarifies that the review subagent carries out merge and worktree cleanup as part of its final clean review / rereview pass, and does not state that the orchestrator "does NOT merge"
- [ ] MAS-203 status is `active` in `docs/srs.md`

---

## Stream A — Routing, Registration & Verification

> Integrate the new orchestration module across agent routing, canonical structure enforcement, and regression coverage.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R5-1.A.1 | Update live and template agent entry points (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, plus `templates/` copies) with an orchestration routing row pointing orchestration intent to `docs/core/orchestrate.md` | 0.75 | Gate | Dependent |
| R5-1.A.2 | Register `docs/core/orchestrate.md` in Doctor's canonical structure surface (`src/doctor/structure.ts`) so it is enforced as a required core file | 0.25 | Gate | Dependent |
| R5-1.A.3 | Update canonical template and structure regression coverage to include `orchestrate.md`, including count-based assertions that move from 19 to 20 core modules and any focused resolver assertions needed for the new file | 1.0 | R5-1.A.2 | Dependent |
| R5-1.A.4 | Run verification (`npm test` and `blueprint doctor`) to confirm the new module, routing rows, and canonical-core registration introduce no regressions | 0.25 | R5-1.A.1, R5-1.A.3 | Dependent |

### Stream A Acceptance Criteria

- [ ] All four live root agent files route orchestration intent to `docs/core/orchestrate.md`
- [ ] All four templated root agent files route orchestration intent to `docs/core/orchestrate.md`
- [ ] `src/doctor/structure.ts` includes `docs/core/orchestrate.md` in `CANONICAL_CORE_FILES`
- [ ] Canonical template inventory and count-based regressions recognize `orchestrate.md` as the twentieth core protocol module
- [ ] Template resolution coverage can locate the new module
- [ ] `npm test` passes with the updated inventory and routing expectations
- [ ] `blueprint doctor` reports no structural or operational failures after the integration

---

## Parallelization Map

```text
Gate R5-1.0 (Orchestration Contract Foundation) ───────────────► Stream A (Routing, Registration & Verification) ───────────────► Phase 1 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate R5-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R5-1.0.1 | — | Not testable: protocol documentation module content, no runtime behavior | — |
| T-R5-1.0.2.1 | R5-1.0.2 | unit | Verify `resolveAllCoreTemplatePaths()` includes `docs/core/orchestrate.md` | Resolved bundled core templates include the new module |
| T-R5-1.0.2.2 | R5-1.0.2 | unit | Verify `templates/docs/core/orchestrate.md` exists, is non-empty, and begins with a heading | Template file is present and valid Markdown |
| — | R5-1.0.3 | — | Not testable: SRS status update in documentation, no runtime behavior | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R5-1.A.1.1 | R5-1.A.1 | unit | Verify all live root agent files contain the orchestration routing row | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `QWEN.md` reference `docs/core/orchestrate.md` with orchestration intent text |
| T-R5-1.A.1.2 | R5-1.A.1 | unit | Verify all templated root agent files contain the orchestration routing row | `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`, and `templates/QWEN.md` reference `docs/core/orchestrate.md` with orchestration intent text |
| T-R5-1.A.2.1 | R5-1.A.2 | unit | Verify `CANONICAL_CORE_FILES` includes `docs/core/orchestrate.md` | Doctor canonical structure tracks the new core file |
| T-R5-1.A.2.2 | R5-1.A.2 | unit | Verify `getCanonicalStructurePaths()` includes `docs/core/orchestrate.md` and the core count moves from 19 to 20 | Canonical path inventory exposes the new required file |
| T-R5-1.A.3.1 | R5-1.A.3 | unit | Verify `templates/docs/core/` contains exactly 20 Markdown protocol files including `orchestrate.md` | Directory listing matches the canonical inventory and count |
| T-R5-1.A.3.2 | R5-1.A.3 | unit | Verify count-based regression tests recognize `orchestrate.md` as the twentieth core module | Inventory assertions pass at 20 files |
| T-R5-1.A.3.3 | R5-1.A.3 | unit | Verify `resolveTemplatePath('docs/core/orchestrate.md')` returns a readable bundled template path | Template resolution locates an existing bundled orchestration module |
| — | R5-1.A.4 | — | Not testable: meta verification step (`npm test`, `blueprint doctor`) | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R5-1.0 | 3 | 1 | 2 |
| Stream A | 4 | 3 | 1 |
| **Total** | **7** | **4** | **3** |

---

## Definition of Done

- [ ] Gate R5-1.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] `docs/core/orchestrate.md` exists in both the live repo and bundled templates
- [ ] `docs/core/phase-completion.md` trigger section acknowledges automatic invocation by phase-level orchestration
- [ ] MAS-203 is active in `docs/srs.md`
- [ ] All live and template agent entry points can route orchestration intent correctly
- [ ] Doctor and template-integrity surfaces treat `orchestrate.md` as canonical
- [ ] No lint or typecheck errors exist in files touched by this phase
- [ ] No regressions are introduced in `blueprint init`, `blueprint doctor`, or template-integrity behavior

---

## Test Scenarios

### Happy Path

- [ ] An agent asked to orchestrate a planned phase can route to `docs/core/orchestrate.md` from any supported live or templated entry point
- [ ] `docs/core/orchestrate.md` instructs the orchestrator to dispatch gate work first, then ready streams in parallel, then dependent streams only after prerequisites are fully closed out (including merge and cleanup by the review subagent)
- [ ] `docs/core/orchestrate.md` defines phase completion as the automatic final sub-step of phase-level orchestration, delegated to an independent phase-completion subagent
- [ ] `docs/core/orchestrate.md` defines a `<PhaseCompletionLoop>` that handles regressions by spawning bug-resolution streams and re-running phase completion until green
- [ ] `docs/core/orchestrate.md` clarifies that the review subagent handles merge and worktree cleanup during its final clean pass, without confusing "orchestrator does NOT merge" language
- [ ] A new Blueprint project scaffold includes `docs/core/orchestrate.md` in its canonical core module set
- [ ] Doctor audit and repair surfaces treat missing or drifted `orchestrate.md` exactly like other canonical core files

### Edge Cases

- [ ] The orchestration module explicitly distinguishes institutional failures from competence failures and defines different responses
- [ ] The orchestration module states that unrelated ready streams continue even if another stream fails permanently
- [ ] The orchestration module states that dependent streams remain blocked and are never spawned if an upstream prerequisite fails permanently
- [ ] The orchestration module states that rereview is conditional and only occurs when the prior review found unresolved issues
- [ ] If the harness lacks higher-effort or better-model options, the orchestrator reports the constraint and proceeds with the best default configuration available
- [ ] The orchestration module states that if phase completion creates bug tasks, the orchestrator spawns a bug-resolution stream and re-runs phase completion automatically rather than requiring a manual re-trigger

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R5-1.TW1), lists affected tasks, and includes test impact.

- **R5-1.TW1 — Phase completion as automatic orchestration sub-step**
  - **Affected tasks**: R5-1.0.1 (orchestrate.md content), R5-1.0.2 (template copy)
  - **Change**: Added step 7 to `<PhaseLevelInvocation>` in `docs/core/orchestrate.md` so phase completion is delegated to an independent phase-completion subagent after all streams close out. Updated `docs/core/phase-completion.md` trigger section to acknowledge automatic invocation by phase-level orchestration. Stream-level orchestration explicitly excluded.
  - **Test impact**: No new tests required — protocol documentation change. Existing test scenarios updated to verify the behavior.

- **R5-1.TW2 — Review subagent owns merge and worktree cleanup**
  - **Affected tasks**: R5-1.0.1 (orchestrate.md content), R5-1.0.2 (template copy)
  - **Change**: Removed confusing "orchestrator does NOT merge branches" boundary language. `<StreamLifecycle>` CLOSEOUT now states the review subagent merges and cleans up as part of its final clean review / rereview pass per `git-review-workflow.md`. Orchestrator boundaries updated to say "does NOT directly merge branches" and delegates to the review subagent.
  - **Test impact**: No new tests required — protocol documentation change. Existing test scenarios updated to verify the behavior.

- **R5-1.TW3 — Phase completion loop with bug-resolution retry**
  - **Affected tasks**: R5-1.0.1 (orchestrate.md content), R5-1.0.2 (template copy)
  - **Change**: Replaced the single-shot phase completion step with a `<PhaseCompletionLoop>` section in `docs/core/orchestrate.md`. The loop: (1) delegates to phase-completion subagent, (2) if blocked by regressions, spawns a bug-resolution stream through execution/review agents, (3) re-runs phase completion after the bug stream closes out. Repeat until green or user stops. Updated `docs/core/phase-completion.md` RegressionHandling to distinguish orchestrator-auto-retry vs manual user retry paths.
  - **Test impact**: No new tests required — protocol documentation change. Existing test scenarios updated to verify the behavior.
