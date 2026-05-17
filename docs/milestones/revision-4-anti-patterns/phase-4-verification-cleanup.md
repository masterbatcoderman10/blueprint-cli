# Phase 4 — Verification & Cleanup Plan

**Status**: Planning
**Milestone**: Revision 4 — Anti-Patterns

---

## Goals

- Correct the revision document to reflect the actual 4-phase structure
- Add an anti-pattern to the git review workflow module preventing worktree abandonment after review
- Add an anti-pattern to the phase completion module preventing orphaned worktrees after phase completion
- Confirm the full test suite passes with all anti-pattern changes in place
- Confirm the project health check (`blueprint doctor`) runs cleanly

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 1 — Structural & SRS Foundation | Complete |
| Phase 2 — Document Updates (Alignment, SRS, Milestone) | Complete |
| Phase 3 — Document Updates (Phase, Revision, Git Workflow) | Complete |

---

## Gate R4-4.0 — Revision Document Sync

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-4.0.1 | Update `docs/milestones/revision-4-anti-patterns/revision-4-anti-patterns.md` phase list from 5 phases to 4 actual phases | 0.25 | None | Independent |

### Gate Acceptance Criteria

- [ ] `docs/milestones/revision-4-anti-patterns/revision-4-anti-patterns.md` lists exactly 4 phases matching the phase graph in `docs/project-progress.md`

---

## Stream A — Git Review Workflow Anti-Pattern

> Adds an anti-pattern to `git-review-workflow.md` warning against leaving worktrees behind after review is complete.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-4.A.1 | Add "Not Cleaning Up Worktrees After Review" anti-pattern to `docs/core/git-review-workflow.md` | 0.5 | Gate | Dependent |
| R4-4.A.2 | Sync changes to `templates/docs/core/git-review-workflow.md` | 0.25 | R4-4.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `docs/core/git-review-workflow.md` contains an `Anti-Patterns` section with guidance against abandoning worktrees after review
- [ ] `templates/docs/core/git-review-workflow.md` matches the live document exactly

---

## Stream B — Phase Completion Anti-Pattern

> Adds an anti-pattern to `phase-completion.md` warning against leaving worktrees of completed streams after phase completion.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-4.B.1 | Add "Not Cleaning Up Completed Stream Worktrees" anti-pattern to `docs/core/phase-completion.md` | 0.5 | Gate | Dependent |
| R4-4.B.2 | Sync changes to `templates/docs/core/phase-completion.md` | 0.25 | R4-4.B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] `docs/core/phase-completion.md` contains an `Anti-Patterns` section with guidance against leaving worktrees of completed streams after phase completion
- [ ] `templates/docs/core/phase-completion.md` matches the live document exactly

---

## Stream C — Verification

> Runs the full test suite and doctor command to confirm all changes introduced no regressions.
> **Depends on:** Stream A and Stream B (anti-pattern additions in place).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-4.C.1 | Run `npm test` and confirm all tests pass | 0.25 | R4-4.A.2, R4-4.B.2 | Dependent |
| R4-4.C.2 | Run `blueprint doctor` and confirm clean health report | 0.25 | R4-4.A.2, R4-4.B.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] `npm test` exits with zero and all test files pass
- [ ] `blueprint doctor` reports no structural or operational failures

---

## Parallelization Map

```text
Gate R4-4.0 (Revision Doc Sync) ───────────────┐
                                                │
              ┌─────────────────────────────────┤
              │                                 │
Stream A (Git Review Anti-Pattern) ─────────────┤
Stream B (Phase Completion Anti-Pattern) ───────┤
              │                                 │
              └─ Stream C (Verification) ───────► Phase 4 complete
                          depends on A + B
```

---

## Definition of Done

- [ ] Gate R4-4.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] All existing tests pass with no regressions
- [ ] `blueprint doctor` exits clean

---

## Test Plan

> Generated from task analysis. This phase is documentation-heavy, with
> only the template synchronization tasks treated as programmatically
> testable. The anti-pattern wording tasks and operational verification
> tasks are recorded as not testable.

### Gate R4-4.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-4.0.1 | — | Not testable: documentation update, no runtime behavior | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-4.A.1 | — | Not testable: protocol documentation update, no runtime behavior | — |
| T-R4-4.A.2.1 | R4-4.A.2 | unit | Verify `templates/docs/core/git-review-workflow.md` matches `docs/core/git-review-workflow.md` exactly after the update | No drift exists between the live and scaffolded git review workflow module |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-4.B.1 | — | Not testable: protocol documentation update, no runtime behavior | — |
| T-R4-4.B.2.1 | R4-4.B.2 | unit | Verify `templates/docs/core/phase-completion.md` matches `docs/core/phase-completion.md` exactly after the update | No drift exists between the live and scaffolded phase completion module |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-4.C.1 | — | Not testable: operational verification, no new code | — |
| — | R4-4.C.2 | — | Not testable: operational verification, no new code | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R4-4.0 | 1 | 0 | 1 |
| Stream A | 2 | 1 | 1 |
| Stream B | 2 | 1 | 1 |
| Stream C | 2 | 0 | 2 |
| **Total** | **7** | **2** | **5** |

---

## Test Scenarios

### Happy Path
- [ ] `npm test` runs the full suite and all tests pass
- [ ] `blueprint doctor` confirms the project structure is intact
- [ ] `git-review-workflow.md` contains the new anti-pattern in both live and template copies
- [ ] `phase-completion.md` contains the new anti-pattern in both live and template copies

### Edge Cases
- [ ] Verification fails if any anti-pattern change introduced a test regression
- [ ] Verification fails if `blueprint doctor` reports missing or invalid structural items
- [ ] Verification fails if a template copy drifts from its live `docs/core/` counterpart

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R4-4.TW1), lists affected tasks, and
> includes test impact. See docs/core/tweak-planning.md for the full
> tweak workflow.

_None._

---
