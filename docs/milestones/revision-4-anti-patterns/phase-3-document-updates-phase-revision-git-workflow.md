# Phase 3 — Document Updates (Phase, Revision, Git Workflow) Plan

**Status**: Planning
**Revision**: Revision 4 — Anti-Patterns
**Task ID Prefix**: R4-3

---

## Goals

- Add anti-pattern guidance to phase planning so schema work is not planned without schema ideation and relationship confirmation
- Add anti-pattern guidance to revision planning so revision work never begins before impact analysis is complete and confirmed
- Add anti-pattern guidance to git execution workflow so execution stays inside worktrees, starts only after tasks move to `In Progress`, and preserves review-note history
- Keep live `docs/core/` and scaffolded `templates/docs/core/` files synchronized
- Reserve broader verification and cleanup work for Revision 4 Phase 4

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 4 Phase 1 — Structural & SRS Foundation | Complete |
| Revision 4 Phase 2 — Document Updates (Alignment, SRS, Milestone) | Complete |
| Revision 4 Phase 3 scope is `phase-planning.md`, `revision-planning.md`, and `git-execution-workflow.md`, plus matching template files | Confirmed |
| Broader verification (`npm test`, `blueprint doctor`, full parity review) remains deferred to Revision 4 Phase 4 | Confirmed |

---

## Gate R4-3.0 — Phase Planning Schema Discipline

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-3.0.1 | Update live `docs/core/phase-planning.md` with separate anti-patterns for skipping schema ideation and failing to confirm relationships between new or changed schema and existing tables or entities | 0.75 | None | Independent |
| R4-3.0.2 | Sync `templates/docs/core/phase-planning.md` to match the live phase-planning module exactly | 0.25 | R4-3.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/phase-planning.md` explicitly warns against skipping schema ideation when new schema creation or existing schema changes are in scope
- [ ] `docs/core/phase-planning.md` explicitly warns against planning schema work without confirming how new or changed relationships connect to existing tables or entities
- [ ] `templates/docs/core/phase-planning.md` matches the live document exactly

---

## Stream A — Revision Planning Impact Discipline

> Prevents revisions from starting on incomplete or unconfirmed analysis.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-3.A.1 | Update live `docs/core/revision-planning.md` with separate anti-patterns for incomplete impact analysis and starting revision work before the full analysis is presented to and confirmed by the user | 0.75 | Gate | Dependent |
| R4-3.A.2 | Sync `templates/docs/core/revision-planning.md` to match the live revision-planning module exactly | 0.25 | R4-3.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `docs/core/revision-planning.md` explicitly warns against partial impact analysis that omits affected milestones, phases, files, tests, SRS requirements, or downstream dependencies
- [ ] `docs/core/revision-planning.md` explicitly requires presenting the full impact analysis to the user and waiting for confirmation before drafting or executing revision work
- [ ] `templates/docs/core/revision-planning.md` matches the live document exactly

---

## Stream B — Git Workflow Execution Discipline

> Prevents execution drift in workspace, task-status, and review-note handling.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-3.B.1 | Update live `docs/core/git-execution-workflow.md` with separate anti-patterns for editing outside a worktree, starting task work before moving tasks to `In Progress`, and overwriting review notes while addressing them | 1.0 | Gate | Dependent |
| R4-3.B.2 | Sync `templates/docs/core/git-execution-workflow.md` to match the live git workflow module exactly | 0.25 | R4-3.B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] `docs/core/git-execution-workflow.md` explicitly warns against making code edits, test runs, or lint passes in the main working directory for gate or stream execution
- [ ] `docs/core/git-execution-workflow.md` explicitly requires moving the gate or stream tasks to `In Progress` before substantive execution work begins
- [ ] `docs/core/git-execution-workflow.md` explicitly warns against overwriting review notes and preserves them as a durable record across re-review cycles
- [ ] `templates/docs/core/git-execution-workflow.md` matches the live document exactly

---

## Parallelization Map

```text
Gate R4-3.0 (Phase Planning Schema Discipline) ───────────────────────────────┐
                                                                               │
                 ┌───────────────────────────────────────┬─────────────────────┤
                 │                                       │                     │
Stream A (Revision Planning Impact Discipline) ─────────►│                     │
Stream B (Git Workflow Execution Discipline) ───────────►│                     │
                                                                               ▼
                                                                     Phase 3 complete
```

---

## Definition of Done

- [ ] Gate R4-3.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] `docs/core/phase-planning.md` and `templates/docs/core/phase-planning.md` both include the new schema-planning anti-pattern guidance
- [ ] `docs/core/revision-planning.md` and `templates/docs/core/revision-planning.md` both include the new revision-analysis anti-pattern guidance
- [ ] `docs/core/git-execution-workflow.md` and `templates/docs/core/git-execution-workflow.md` both include the new execution-discipline anti-pattern guidance
- [ ] No Revision 4 Phase 3 document-update scope remains deferred beyond the explicit Phase 4 verification and cleanup work

---

## Test Plan

> Generated from task analysis. This phase is documentation-heavy, so
> only the live/template synchronization tasks are treated as
> programmatically testable. The anti-pattern wording tasks are
> recorded as not testable protocol-documentation work.

### Gate R4-3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-3.0.1 | — | Not testable: protocol documentation update, no runtime behavior | — |
| T-R4-3.0.2.1 | R4-3.0.2 | unit | Verify `templates/docs/core/phase-planning.md` matches `docs/core/phase-planning.md` exactly after the update | No drift exists between the live and scaffolded phase-planning module |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-3.A.1 | — | Not testable: protocol documentation update, no runtime behavior | — |
| T-R4-3.A.2.1 | R4-3.A.2 | unit | Verify `templates/docs/core/revision-planning.md` matches `docs/core/revision-planning.md` exactly after the update | No drift exists between the live and scaffolded revision-planning module |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R4-3.B.1 | — | Not testable: protocol documentation update, no runtime behavior | — |
| T-R4-3.B.2.1 | R4-3.B.2 | unit | Verify `templates/docs/core/git-execution-workflow.md` matches `docs/core/git-execution-workflow.md` exactly after the update | No drift exists between the live and scaffolded git workflow module |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R4-3.0 | 2 | 1 | 1 |
| Stream A | 2 | 1 | 1 |
| Stream B | 2 | 1 | 1 |
| **Total** | **6** | **3** | **3** |

---

## Test Scenarios

### Happy Path

- [ ] Phase planning ideates required schema work before task breakdown and confirms how new or changed relationships connect to existing tables or entities
- [ ] Revision planning completes the full top-down impact analysis, presents it, receives user confirmation, and only then proceeds to drafting or execution
- [ ] Git execution starts inside the correct worktree only after the relevant gate or stream tasks are moved to `In Progress`
- [ ] Review-note handling preserves prior reviewer feedback instead of replacing it during re-review preparation
- [ ] Each `templates/docs/core/` file remains identical to its live `docs/core/` source after the update

### Edge Cases

- [ ] A phase changes relationships on an existing schema object without introducing a brand-new table; phase planning still requires schema ideation and explicit relationship confirmation
- [ ] A revision touches multiple milestones, phases, tests, and SRS requirements; revision planning still blocks progress until the full impact map is presented and confirmed
- [ ] Execution resumes after an interruption; the workflow reuses the existing worktree and still forbids edits in the main working directory
- [ ] A stream goes through multiple review rounds; new review-note handling preserves earlier notes instead of overwriting the review history

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R4-3.TW1), lists affected tasks, and
> includes test impact. See docs/core/tweak-planning.md for the full
> tweak workflow.

### R4-3.TW1 — Keep detailed task breakdown out of revision plans

- **Corrects:** R4-3.A.1, R4-3.A.2
- **Reason:** Stream A's revision-planning anti-patterns did not explicitly block putting detailed phase-level gate, stream, or task breakdowns in the revision document itself.
- **Source of truth:** User correction during Revision 4 Phase 3 Stream A review.
- **Changes:** Add a revision-planning anti-pattern to live and template `revision-planning.md` that keeps revision documents at phase-outline level and reserves detailed task breakdown for later phase plans.
- **Test impact:** None — user requested no test update; existing `T-R4-3.A.2.1` still verifies live/template parity.
- **Status:** done
