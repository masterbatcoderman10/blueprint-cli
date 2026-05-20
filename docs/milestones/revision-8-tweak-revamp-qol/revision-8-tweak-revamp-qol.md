# Revision 8 - Tweak Revamp and Quality of Life Changes

**Status**: Planning
**Priority**: Next
**Trigger**: 2026-05-20 user correction - repurpose confirmed standalone Tweaks 2 through 5 into a revision because the work changes core workflow contracts, board behavior, orchestration scope, and the meaning of the standalone tweak workflow.

---

## What Is Changing

Revision 8 uses the previously confirmed quality-of-life material as source
input for a normal revision. That material has already been reclassified:
the old tweak docs are audit records, their board tasks have been removed
through the tracker API, and the executable work now lives in two revision
phases:

1. **Phase 1 - Quality of Life Workflow Hardening** combines the former
   tracker workflow hardening, task-detail default-open behavior, and
   bug orchestration / phase-completion loop language.
2. **Phase 2 - Tweak Planning Flow Rewrite** replaces the current
   tracker-backed pre-planned tweak workflow with a change-first,
   user-reviewed, post-hoc documentation flow.

The new tweak flow is intentionally different from Revision 7:

1. Understand what the user asked.
2. Briefly restate that understanding.
3. Get confirmation before changing behavior or files.
4. Make the requested change first.
5. Cycle with the user while the user reviews the result.
6. Do not create tracker/board tasks for tweaks.
7. After the user confirms the change, create the tweak document to record
   what was done.

This restores tweaks to their intended essence: a lightweight path for small,
contained changes that need user review and traceability, but not board-task
planning overhead.

---

## Why

The confirmed standalone tweak plans started drifting away from the intended
tweak shape. They created board tasks, multi-step execution plans, and
review/test structure that made tweaks behave like miniature revisions.

Revision 8 corrects that by:

- preserving the useful quality-of-life improvements as normal revision work
- removing board-task creation from tweak planning
- keeping tweak documentation as an audit artifact created after the user
  accepts the actual change
- clarifying that bug orchestration reuses the same stream-style orchestration
  loop and that phase-completion bugs are delegated until completion is clean
- tightening tracker-facing workflows without rewriting entire protocols

---

## Impact Analysis

This revision is **modifying**. It changes active Blueprint workflow
contracts introduced by Revisions 5, 6, and 7.

### Affected Product Milestones

| Milestone | Impact |
|-----------|--------|
| M1 - Project Bootstrap | Core protocol docs, templates, tracker board UI, Doctor/template expectations, and workflow tests change. |

### Affected Historical Revisions

| Revision | Impact |
|----------|--------|
| Revision 5 - Orchestration Protocol | `orchestrate.md` gains formal bug orchestration language and phase-completion bug-loop behavior. |
| Revision 6 - Built-in Task Tracker | Tracker-facing workflows gain API-only mutation anti-patterns, comment/reply discipline, filtered lookup guidance, and board task-detail quality-of-life behavior. |
| Revision 7 - Standalone Tweak Workflow | MAS-206 is superseded by a new change-first tweak workflow that no longer creates board tasks and creates tweak docs only after user-confirmed changes. |

### Affected Files and Modules

**Core protocol docs:**

| File | Change |
|------|--------|
| `docs/core/health-check.md` | Session-start context should include `docs/core/tracker.md` for tracker-backed projects. |
| `docs/core/execution.md` | Add API-only tracker mutation anti-pattern, filtered milestone/phase/stream task lookup guidance, remove task-description review scaffolding, and require implementers to reply to reviewer comments when addressing them. |
| `docs/core/review.md` | Add API-only tracker mutation anti-pattern and require actionable review feedback to be left as tracker comments. |
| `docs/core/git-execution-workflow.md` | Add API-only tracker mutation anti-pattern. |
| `docs/core/git-review-workflow.md` | Add API-only tracker mutation anti-pattern. |
| `docs/core/orchestrate.md` | Clarify bug orchestration is similar to stream orchestration and reuses the same execute -> review -> address -> rereview loop; add phase-completion bug delegation loop. |
| `docs/core/phase-completion.md` | Require the orchestrator to delegate execution for revealed bugs, then rerun phase completion until clean. |
| `docs/core/tweak-planning.md` | Phase 2 rewrite: change-first, user-review loop, no board tasks, post-hoc tweak document after confirmation. |

**Templates and routing:**

| File | Change |
|------|--------|
| `templates/docs/core/*` mirrors for all touched core docs | Mirror live doc updates byte-for-byte where this repo enforces template parity. |
| Root/template agent routing docs | Update tweak intent language after Phase 2 so tweak planning no longer means pre-task board planning. |

**Board and tracker UI:**

| File / Area | Change |
|-------------|--------|
| `src/tracker/spa/**` | Task Detail rail opens by default and supports immediate task swapping when another task card is clicked. |
| `tests/spa/**`, `tests/tracker/spa/**` | Forward-only updates for default-open rail, hash-selected task behavior, and quick-swap behavior. |

**Audit records:**

| File | Change |
|------|--------|
| `docs/tweaks/tweak-2-tracker-workflow-contract-hardening.md` | Mark superseded by Revision 8 Phase 1. |
| `docs/tweaks/tweak-3-task-detail-default-open.md` | Mark superseded by Revision 8 Phase 1. |
| `docs/tweaks/tweak-4-orchestration-bug-and-tweak-scope.md` | Mark superseded by Revision 8 Phase 1. |
| `docs/tweaks/tweak-5-pre-task-tweak-confirmation-gate.md` | Mark superseded/replaced by Revision 8 Phase 2. |

### Affected Tests

| Test Area | Expected Impact |
|-----------|-----------------|
| `tests/revision-5/**` | Orchestration doc-contract tests update for bug orchestration and phase-completion bug delegation loop. |
| `tests/revision-6/**` | Tracker protocol doc tests update for API-only anti-patterns, filtered lookup, comments, replies, and template mirrors. |
| `tests/revision-7/**`, `tests/gate-r7-1-0/**`, `tests/revision-2/gate-1.0/tweak-contract.test.ts` | Tweak-planning contract tests update for the new change-first, no-board-task, post-hoc document flow. |
| `tests/spa/rail/**`, `tests/spa/board/**`, `tests/tracker/spa/**` | Board UI tests update for default-open rail and quick-swap behavior. |
| `tests/stream-c/project-templates-mirror.test.ts`, template mirror tests | Touched live/template protocol docs must remain mirrored. |

### Planning Cleanup Already Applied

The previously confirmed Tweak 2 through Tweak 5 board tasks no longer
represent executable standalone tweak work. During Revision 8 planning, they
were removed from the tracker via the tracker HTTP API, and the tweak docs
were left in place as superseded audit records.

---

## SRS Implications

Classification per `revision-planning.md` `<RevisionSRSImpact>`:

| Requirement ID | Action | Detail |
|----------------|--------|--------|
| MAS-203 | Same ID, elaborated | Orchestration still means dispatching work through the existing execute/review/address/rereview loop. Revision 8 clarifies that bug orchestration is similar to stream orchestration and that phase-completion bugs must be delegated through the same loop until completion is clean. |
| MAS-204 | Same ID, elaborated | The built-in tracker still owns the same user outcome. Revision 8 tightens the tracker mutation contract: workflow agents must use the tracker API, not raw SQL/database edits, and comments/replies become the formal review-feedback surface. |
| MAS-205 | Same ID, elaborated | The local board UI still owns the same user outcome. Revision 8 adds task-detail quality-of-life behavior: default-open detail rail and immediate task swapping on card click. |
| MAS-206 | Superseded | Revision 7's standalone tweak workflow required pre-planned tweak docs and tracker tasks. Revision 8 replaces that meaning. |
| MAS-207 | Create | New requirement: **Change-First Tweak Workflow**. Status `approved-pending-implementation`. Supersedes MAS-206. |

MAS-207 moves to `active` when Revision 8 Phase 2 completes.

---

## Phases

This revision requires **two phases**. The quality-of-life material is grouped
as Phase 1 streams; the tweak-planning rewrite is isolated in Phase 2.

| Phase | Name | Scope Summary |
|-------|------|---------------|
| 1 | Quality of Life Workflow Hardening | Tracker workflow contract hardening, task viewer default-open/quick-swap behavior, and bug orchestration / phase-completion loop language. |
| 2 | Tweak Planning Flow Rewrite | Replace the Revision 7 tweak workflow with the change-first user-review loop: confirm understanding, make the change, cycle with user review, no board tasks, then create the tweak document after confirmation. |

---

## Success Criteria

- [ ] Tracker-facing workflows forbid raw SQL/database mutation and point agents to the tracker API.
- [ ] Review and addressing workflows use tracker comments and replies for actionable feedback.
- [ ] Execution workflow uses milestone + phase + stream filters when that context is available.
- [ ] Task creation guidance avoids stream-title duplication and removes `Review Notes` scaffolding.
- [ ] Task Detail rail opens by default and clicking another task swaps the visible task immediately.
- [ ] Orchestration formally supports bug orchestration as a stream-like loop.
- [ ] Phase completion delegates revealed bugs to executor agents and reruns completion until clean.
- [ ] Tweak planning is rewritten as a change-first, user-reviewed, no-board-task workflow.
- [ ] Post-hoc tweak documents are created only after the user confirms the completed change.
- [ ] MAS-206 is superseded and MAS-207 records the new tweak workflow target state.
- [ ] Live docs and templates remain mirrored where required.
- [ ] Full test suite remains green after forward-only test updates.

---

## Explicitly Not Changing

| File / Area | Reason |
|-------------|--------|
| Tweak 1 | The user only reclassified Tweaks 2 through 5 into Revision 8. Tweak 1 remains standalone unless separately changed. |
| Tracker schema | The requested quality-of-life changes use existing task/comment fields and API endpoints. |
| Historical revision/phase docs | They remain audit history. |
| Bug-resolution meaning | Bugs still route through `bug-resolution.md`; Revision 8 only clarifies orchestration behavior for bug-task execution. |
| Full phase/test-planning workflow | Revision 8 does not remove formal planning for revisions, phases, or bug work. |

---

## Sequencing & Triggers

- Revision 8 is the next pending revision after Revision 7.
- Phase 1 can be planned immediately because the quality-of-life source material already defines the scope.
- Phase 2 should be planned after Phase 1 planning is reviewed, because it changes the core meaning of tweaks and supersedes MAS-206.
