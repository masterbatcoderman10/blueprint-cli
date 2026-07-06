# Phase 5 — Revision Integration Verification and Bookkeeping Plan

**Status**: Planning
**Milestone**: Revision 12 — Alignment Split and Foundation Planning
**Phase ID prefix**: R12-5

---

## Goals

- Verify Revision 12 as an integrated change after Phases 2, 3, and 4 have landed.
- Catch cross-surface drift that individual phase verification may not see.
- Keep SRS work audit-only unless final implementation differs from the current same-ID elaborations.
- Keep documentation work limited to stale active-surface cleanup discovered during the audit.
- Complete final full-suite, release-package, and progress-bookkeeping checks before closing the revision.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 12 Phase 1 — Bootstrap Surface and Skill Payload Contract | Complete |
| Revision 12 Phase 2 — Alignment Setup Split | Complete |
| Revision 12 Phase 3 — Foundation Planning Module | Complete |
| Revision 12 Phase 4 — Command and Migration Semantics | Required before Phase 5 execution |

Phase 5 may be planned before Phase 4 completes, but it should not execute until Phase 4 has landed because Phase 5 verifies the combined Revision 12 behavior and closes the revision.

---

## Gate R12-5.0 — Closeout Checklist

> Establish the exact closeout checklist before parallel audit and verification begin.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-5.0.1 | Build the final Revision 12 closeout checklist from the Phase 2, Phase 3, and Phase 4 plans plus the Revision 12 success criteria. | 0.5 | None | Independent |
| R12-5.0.2 | Identify the existing targeted suites and verification commands that cover skill payload mirrors, setup gate routing, command semantics, root entry-point contracts, package contents, and release packaging. Do not plan new raw-string doc tests. | 0.5 | R12-5.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] The closeout checklist maps back to Revision 12 success criteria.
- [ ] Phase 5 scope is limited to drift audit, verification, discovered fixes, and bookkeeping.
- [ ] Existing verification commands are identified before execution starts.
- [ ] No new raw-string doc-contract test is planned as default Phase 5 work.

## Gate R12-5.0 Closeout Checklist Output

| Checklist ID | Closeout item | Revision 12 success-criteria coverage | Phase-plan source | Phase 5 owner | Evidence expected during Phase 5 |
|--------------|---------------|---------------------------------------|-------------------|---------------|----------------------------------|
| CL-1 | Confirm Alignment stayed setup-only, keeps approval-before-write discipline, writes `<ProjectConventions>` / `<AgentOrchestration>`, preserves the migrated/incomplete-alignment repair boundaries, and ends with the fresh-session Foundation Planning handoff. | Success criteria: Alignment no longer produces planning artifacts; Alignment writes setup blocks and runs `blueprint alignment-complete` only after approval; Alignment ends with the fresh-session handoff. | Phase 2 Gate R12-2.0; Stream A; Stream B; Stream C | Stream A audit plus Stream B targeted suites | Active-surface audit stays clean and the existing Phase 2 / command-doc suites still prove setup-only wording, approval gating, migrated-state repair, and no downstream planning side effects. |
| CL-2 | Confirm Foundation Planning remains a live skill-only workflow with the locked bootstrap preconditions, one-artifact-at-a-time sequencing, per-artifact disk-draft review gates, and no legacy/core or downstream planning leakage. | Success criteria: Foundation Planning is skill-only and routed from `SKILL.md`; it creates PRD, SRS, and `docs/project-progress.md` only; it requires explicit approval between artifacts; it does not create milestone documents. | Phase 3 Gate R12-3.0; Stream A; Stream B; Stream C | Stream A audit plus Stream B targeted suites | Active docs and SRS elaborations still match the Phase 3 contract, and the existing Foundation Planning suites remain green without any new Phase 5 raw-string coverage. |
| CL-3 | Confirm the carried-forward bootstrap surfaces still hold: 24-file skill payload inventory, local skill mirror, root entry-point placeholder contract, and no legacy Foundation Planning route. | Success criteria: skill payload, Doctor canonical payload, local skill mirror, and release/package verifier include 24 skill files; skill-mode root entry-point templates contain split-block placeholders; legacy core routing does not gain Foundation Planning. | Revision 12 success-criteria carry-forward plus Phase 3 Stream C alignment work | Stream B targeted suites | Existing payload, mirror, root-entry-point, and package-surface suites still pass against the live template bodies and placeholder/root contract. |
| CL-4 | Confirm bootstrap routing and command semantics still agree after all three behavior phases: setup gate stop states, `alignment-complete` validation and no-partial-flip rules, markerless-file reporting, absent-file skipping, legacy-origin cleanup, and forced realignment on `migrate`. | Success criteria: setup gate routes the defined bootstrap states correctly; `alignment-complete` validates blocks and avoids partial flips; `migrate` forces realignment with placeholders, legacy-origin, and `alignment-required`. | Phase 2 migrated/incomplete-alignment boundaries; Phase 4 Gate R12-4.0; Stream A; Stream B; Stream C | Stream B targeted suites | Existing bootstrap, command-foundation, alignment-complete, migrate, and active-doc regression suites still pass and no active doc drifts back to pre-Revision-12 semantics. |
| CL-5 | Confirm same-ID SRS elaborations and active docs are still current for MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212, with cleanup limited to proven drift. | Success criteria: SRS same-ID elaborations are applied; tests that asserted old behavior are updated to the new behavior. | Phase 5 Stream A | Stream A audit | `docs/srs.md` and active docs either need no edits or receive minimal same-ID / stale-guidance corrections only where implementation drift is proven. |
| CL-6 | Confirm final verification and bookkeeping close the revision without expanding scope: targeted revision suites, full `npm test`, `npm run release:pack:verify`, and `docs/project-progress.md` completion entry after audit + verification are clean. | Success criteria: targeted revision tests, full `npm test`, and package/release verification pass before revision completion. | Phase 4 Stream D; Phase 5 Stream B | Stream B verification and bookkeeping | Existing targeted commands, full-suite verification, release-package verification, and the final Revision 12 completion update in `docs/project-progress.md` all succeed before phase closeout. |

Closeout rule: Phase 5 is an audit-and-verify phase. If one checklist item fails, fix only the drift required to satisfy that item and rerun the existing coverage. Do not broaden scope into unrelated rewrites.

## Gate R12-5.0 Verification Command Inventory

| Surface | Existing targeted suites / commands | Purpose in Phase 5 |
|---------|-------------------------------------|--------------------|
| Setup gate routing and bootstrap stop states | `npm test -- tests/revision-12/gate-1.0 tests/revision-12/stream-b/entry-point-placeholder-contract.test.ts` | Re-checks the bootstrap state machine, the skill-only route boundary, and the live root/template placeholder split before final closeout. |
| Alignment setup-only contract and migrated/incomplete-alignment repair | `npm test -- tests/revision-12/gate-2.0 tests/revision-12/stream-a/setup-interview-and-block-authoring.test.ts tests/revision-12/stream-b/migration-and-incomplete-alignment-repair.test.ts tests/revision-12/stream-c/phase-2-boundary-contract.test.ts` | Covers setup-only Alignment wording, block-authoring rules, migrated-state repair, and the no-downstream-planning boundary. |
| Foundation Planning workflow and skill-only boundary | `npm test -- tests/revision-12/gate-3.0 tests/revision-12/stream-a/foundation-planning-artifact-workflow.test.ts tests/revision-12/stream-b/foundation-planning-boundary-and-review-gates.test.ts tests/revision-12/stream-c/foundation-planning-cross-surface-alignment.test.ts` | Verifies the full live Foundation Planning contract, artifact sequencing, approval gates, and no legacy/core leakage. |
| Command semantics and active command docs | `npm test -- tests/revision-12/gate-4.0 tests/revision-12/stream-a/alignment-complete-phase-4.test.ts tests/revision-12/stream-c/command-and-alignment-doc-regression.test.ts tests/revision-11/stream-b/migrate-command.test.ts tests/revision-11/stream-c/active-command-docs.test.ts tests/revision-1/stream-b/command-help-metadata.test.ts` | Re-checks `alignment-complete` validation, forced-realignment migration, active command-copy surfaces, and help metadata after the integrated revision lands. |
| Skill payload mirrors, local install, package surface, and root entry-point contracts | `npm test -- tests/revision-11/gate-4.0/skill-payload-inventory.test.ts tests/revision-11/stream-a/skill-payload-mirror-contract.test.ts tests/revision-11/stream-b/local-skill-install.test.ts tests/revision-11/stream-b/package-surface.test.ts tests/revision-11/stream-b/release-package-artifact.test.ts tests/revision-11/phase-5/root-entry-points.test.ts` | Re-checks the 24-file payload inventory, byte-identical mirrors, local install surface, packaged skill payload, and live root entry-point block contract. |
| Release-facing package contents and release docs | `npm test -- tests/phase-4/gate-4.0/release-contract.test.ts tests/phase-4/stream-a/packaged-artifact-smoke.test.ts tests/phase-4/stream-b/release-check-reuse.test.ts tests/phase-4/stream-c/package-metadata.test.ts tests/phase-4/stream-c/release-docs.test.ts` | Re-checks the published package surface, packed-artifact smoke path, package metadata, shared release-check contract, and release-document alignment. |
| Full project regression sweep | `npm test` | Final integrated regression pass after any Phase 5 drift fixes. |
| Release-package verification | `npm run release:pack:verify` | Final packaged-artifact guard before revision completion bookkeeping. |

Coverage rule: the inventory above is the default Phase 5 verification surface. Do not add a new raw-string doc-contract test as routine Phase 5 work. If Phase 5 finds a real regression risk that existing coverage misses, add at most the minimal behavioral or structural assertion needed to close that gap.

---

## Stream A — Cross-Surface Drift Audit

> Audit requirement and documentation surfaces for drift after all behavior phases have landed.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-5.A.1 | Audit `docs/srs.md` MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212 against final Phase 2-4 behavior. Edit only if implementation drift is found. | 0.75 | Gate | Dependent |
| R12-5.A.2 | Audit active docs and examples for stale Revision 12 guidance, especially alignment-as-document-production, deferred Foundation Planning wording, future Phase 4 command wording, legacy Foundation Planning routes, and smart-merge migration claims. | 0.75 | Gate | Dependent |
| R12-5.A.3 | Apply minimal SRS or docs cleanup discovered by A.1 or A.2, preserving current wording when no drift exists. | 0.75 | A.1, A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] SRS same-ID elaborations are confirmed current or minimally corrected for actual drift.
- [ ] Active docs do not describe Alignment as producing PRD, SRS, milestone, phase, test-plan, tracker-task, or project-progress artifacts.
- [ ] Active docs do not describe Foundation Planning as future-only or legacy-routed.
- [ ] Active docs do not describe Phase 4 command behavior as deferred or migration as preserving `alignment-complete`.
- [ ] Any cleanup is limited to confirmed drift, not broad rewriting.

---

## Stream B — Final Verification and Bookkeeping

> Run the existing verification surface and close Revision 12 bookkeeping after the audit is clean.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R12-5.B.1 | Run existing targeted Revision 12 and related Revision 11 suites for setup gate routing, skill payload mirrors, command semantics, root entry-point contracts, local install/package payloads, and active command docs. Fix only failures attributable to Revision 12 integration drift. | 1.0 | Gate | Dependent |
| R12-5.B.2 | Run `npm test` and `npm run release:pack:verify`; fix only failures attributable to Revision 12 integration drift. | 1.0 | B.1 | Dependent |
| R12-5.B.3 | After Stream A is clean and B.2 passes, update `docs/project-progress.md` to record Phase 5 and Revision 12 completion. | 0.5 | A.3, B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] Existing targeted suites covering Revision 12 integration surfaces pass.
- [ ] Full `npm test` passes.
- [ ] `npm run release:pack:verify` passes or a true external blocker is recorded.
- [ ] No new test files are added unless verification exposes a real unprotected regression risk.
- [ ] Any new test added as an exception is behavioral or structural, not raw-string matching.
- [ ] Project progress records Phase 5 completion and Revision 12 completion only after audit and verification are clean.

---

## Parallelization Map

```text
Gate R12-5.0 (Closeout Checklist) ───────────────────────────────┐
                                                                  │
                 ┌────────────────────────────────────────────────┤
                 │                                                │
Stream A (Cross-Surface Drift Audit) ────────────────────────────►│
Stream B (Final Verification) ───────────────────────────────────►│
                 │                                                │
                 └── B.3 bookkeeping depends on A.3 + B.2 ───────►│
                                                                  │
                                                                  ▼
                                           Revision 12 complete
```

Streams A and B can start in parallel after the gate. The only cross-stream dependency is the final bookkeeping task, which must wait until both audit and verification are clean.

---

## Test Plan

> Generated from task analysis. Phase 5 does not introduce new behavior, data models, command surfaces, or runtime control flow. No new tests are planned. Each task is verified through audit evidence, existing targeted suites, full-suite verification, release package verification, or completion bookkeeping.

### Gate R12-5.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-5.0.1 | — | Not testable: this task produces the closeout checklist, not executable behavior. | Checklist is reviewed against Revision 12 success criteria. |
| — | R12-5.0.2 | — | Not testable: this task identifies existing verification commands and explicitly avoids new raw-string doc tests. | Existing targeted suites and commands are recorded before execution begins. |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-5.A.1 | — | Not testable: this is an SRS drift audit, and no new behavior is produced unless implementation drift is found. | MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212 are confirmed current or minimally corrected. |
| — | R12-5.A.2 | — | Not testable: this is an active-doc drift audit, and raw-string doc assertions are intentionally out of scope. | Stale active guidance is found and corrected through review rather than new brittle string tests. |
| — | R12-5.A.3 | — | Not testable: this task applies any audit cleanup found by A.1 or A.2; it creates no independent behavior surface. | Cleanup is limited to confirmed drift and reviewed against Stream A acceptance criteria. |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R12-5.B.1 | — | Not testable: this task runs existing targeted suites rather than creating new tests. | Existing targeted Revision 12 and related Revision 11 suites pass, or integration drift is fixed and rerun. |
| — | R12-5.B.2 | — | Not testable: this task runs full-suite and release verification commands rather than adding new test code. | `npm test` and `npm run release:pack:verify` pass, or a true external blocker is recorded. |
| — | R12-5.B.3 | — | Not testable: this is completion bookkeeping in `docs/project-progress.md`. | Project progress is updated only after Stream A is clean and B.2 passes. |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R12-5.0 | 2 | 0 | 2 |
| Stream A | 3 | 0 | 3 |
| Stream B | 3 | 0 | 3 |
| **Total** | **8** | **0** | **8** |

---

## Verification and Test Posture

Phase 5 does not plan new test development. It relies on existing targeted suites, full `npm test`, and release package verification.

New tests are exception-only. Add one only when Phase 5 finds a real regression risk that existing coverage missed, and prefer behavioral or structural assertions over raw-string document matching.

---

## Definition of Done

- [ ] Gate acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] All tests in the Test Plan pass; the current plan contains no new test implementation tasks.
- [ ] No planned raw-string doc tests are introduced.
- [ ] Any SRS or docs edits are limited to confirmed drift.
- [ ] Existing targeted Revision 12 / Revision 11 integration suites pass.
- [ ] `npm test` passes.
- [ ] `npm run release:pack:verify` passes.
- [ ] `docs/project-progress.md` records Phase 5 and Revision 12 completion.

---

## Test Scenarios

### Happy Path

- [ ] SRS MAS-203, MAS-208, MAS-209, MAS-210, MAS-211, and MAS-212 already match final implementation and need no edits.
- [ ] Active docs contain no stale Alignment, Foundation Planning, migration, or command-semantics guidance.
- [ ] Existing targeted suites, full `npm test`, and release package verification all pass.
- [ ] Project progress is updated only after audit and verification are clean.

### Edge Cases

- [ ] SRS drift is found after Phase 4; Stream A makes a minimal same-ID correction before completion.
- [ ] Active docs still mention old alignment document production; Stream A removes or corrects the stale guidance.
- [ ] A targeted suite fails because two Revision 12 surfaces disagree; Stream B fixes the integration drift and reruns the failing suite.
- [ ] Existing coverage misses a meaningful regression risk; a behavioral or structural test is added as an exception, with no raw-string matching.

---

## Data Schema

### None
