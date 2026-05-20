# Phase 1 - Quality of Life Workflow Hardening Plan

**Status**: Planning
**Milestone**: Revision 8 - Tweak Revamp and Quality of Life Changes
**Task ID prefix**: `R8-1`

---

## Goals

- Harden tracker-facing workflows with focused API-only, filtered lookup, comment, and reply guidance.
- Improve board task-detail behavior with default-open selection and immediate task swapping.
- Formalize bug orchestration and the phase-completion bug delegation loop.
- Keep all workflow changes additive and focused; avoid full rewrites until Revision 8 Phase 2.
- Preserve live/template parity for touched protocol docs.
- Use focused forward-only tests to lock the tracker, board, and orchestration behavior.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 5 - Orchestration Protocol complete | Complete |
| Revision 6 - Built-in Task Tracker complete | Complete |
| Revision 7 - Standalone Tweak Workflow complete | Complete |
| Revision 8 overview document created | Complete |
| Quality-of-life source material reclassified into Revision 8 | Complete |

---

## Stream A - Tracker Workflow Contract Hardening

> Tracker-facing protocol docs gain focused additions for API-only mutation, filtered lookup, review comments, comment replies, and clean task descriptions.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-1.A.1 | Add session-start guidance so populated tracker-backed projects load `docs/core/tracker.md` alongside the existing startup context. Mirror the change to templated agent/session-start surfaces if applicable. | 0.75 | None | Independent |
| R8-1.A.2 | Add an API-only tracker mutation anti-pattern to `docs/core/execution.md`; agents must not manipulate `docs/.blueprint/tasks.db` or raw SQL for tracker state changes. | 0.5 | None | Independent |
| R8-1.A.3 | Add the same API-only tracker mutation anti-pattern to `docs/core/review.md`. | 0.5 | None | Independent |
| R8-1.A.4 | Add the same API-only tracker mutation anti-pattern to `docs/core/git-execution-workflow.md`. | 0.5 | None | Independent |
| R8-1.A.5 | Add the same API-only tracker mutation anti-pattern to `docs/core/git-review-workflow.md`. | 0.5 | None | Independent |
| R8-1.A.6 | Add execution guidance for retrieving task work with milestone + phase + stream filters whenever that context is available. | 0.5 | R8-1.A.2 | Dependent |
| R8-1.A.7 | Adjust execution task-creation guidance so new task descriptions do not duplicate the stream title and do not scaffold a `Review Notes` section. | 0.5 | R8-1.A.2 | Dependent |
| R8-1.A.8 | Add review guidance requiring actionable feedback to be left as tracker comments instead of task-description prose. | 0.5 | R8-1.A.3 | Dependent |
| R8-1.A.9 | Update `docs/core/execution.md` addressing workflow so implementers reply to reviewer comments when addressing them. | 0.5 | R8-1.A.8 | Dependent |
| R8-1.A.10 | Mirror all touched tracker-facing workflow docs into `templates/docs/core/` and refresh focused doc-contract/template-parity tests. | 1.0 | R8-1.A.1-R8-1.A.9 | Dependent |

### Stream A Acceptance Criteria

- [ ] Tracker mutation anti-patterns exist in execution, review, git execution, and git review workflows.
- [ ] Each anti-pattern points agents to the tracker HTTP API recipes in `docs/core/tracker.md`.
- [ ] Session-start guidance includes `docs/core/tracker.md` for populated tracker-backed projects.
- [ ] Execution guidance uses milestone + phase + stream filters when available.
- [ ] Task creation guidance omits stream-title duplication and `Review Notes` scaffolding.
- [ ] Review guidance requires actionable feedback as tracker comments.
- [ ] Addressing guidance tells implementers to reply to reviewer comments.
- [ ] Touched live docs and templates match where template parity is expected.

---

## Stream B - Task Detail Rail Quality of Life

> The board opens with a useful task-detail rail and swaps tasks directly when the user clicks another card.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-1.B.1 | Define the task-detail selection contract: valid `#task=<id>` hash remains authoritative; otherwise the board selects a deterministic initial task and opens the rail by default. | 0.5 | None | Independent |
| R8-1.B.2 | Update SPA selection/store behavior so the Task Detail rail is open by default with the selected task when tasks are available. | 0.75 | R8-1.B.1 | Dependent |
| R8-1.B.3 | Fix quick-swap behavior so clicking a different task while the rail is open immediately changes the detail task instead of closing the viewer first. | 0.75 | R8-1.B.2 | Dependent |
| R8-1.B.4 | Refresh focused SPA rail/board/store tests for hash selection, deterministic default selection, manual close behavior, and quick-swap behavior. | 1.0 | R8-1.B.2, R8-1.B.3 | Dependent |

### Stream B Acceptance Criteria

- [ ] A valid `#task=<id>` hash selects that task and opens the rail.
- [ ] Without a hash, the board chooses a deterministic initial task and opens the rail by default when tasks exist.
- [ ] Clicking another card while the rail is open swaps the visible task immediately.
- [ ] Manual close/select behavior remains covered and does not regress.
- [ ] Focused SPA tests cover default-open, hash-driven selection, and quick-swap.

---

## Stream C - Bug Orchestration and Completion Loop

> Orchestration docs formally cover bug orchestration as stream-like work, and phase completion loops until delegated bug execution is clean.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-1.C.1 | Add `docs/core/orchestrate.md` language stating that bug-task orchestration is similar to stream orchestration and may use the existing stream lifecycle. | 0.5 | None | Independent |
| R8-1.C.2 | Clarify that bug orchestration uses the same execute -> review -> address -> rereview loop as stream orchestration and does not define a separate lifecycle. | 0.5 | R8-1.C.1 | Dependent |
| R8-1.C.3 | Tighten orchestrator delegation prompt guidance so sub-agent prompts mention only the action, relevant task/review/address/rereview/phase-completion intent, and phase/stream context; avoid complex prompt engineering. | 0.5 | R8-1.C.2 | Dependent |
| R8-1.C.4 | Update phase-completion/orchestration guidance so bugs revealed during review or phase completion are delegated to executor agents, then phase completion reruns until clean. | 0.75 | R8-1.C.2 | Dependent |
| R8-1.C.5 | Add orchestration guidance to stop the board after orchestration finishes. | 0.25 | R8-1.C.4 | Dependent |
| R8-1.C.6 | Mirror orchestration and phase-completion changes into templates and refresh focused orchestration doc-contract/template-parity tests. | 1.0 | R8-1.C.1-R8-1.C.5 | Dependent |

### Stream C Acceptance Criteria

- [ ] `docs/core/orchestrate.md` explicitly says bug tasks can be coordinated by orchestration.
- [ ] Bug orchestration is described as similar to stream orchestration.
- [ ] Bug orchestration reuses execute -> review -> address -> rereview instead of defining a special lifecycle.
- [ ] Sub-agent prompt guidance is intentionally simple and context-based.
- [ ] Phase completion delegates revealed bugs to executor agents and reruns until phase completion is clean.
- [ ] Orchestration shutdown includes stopping the board after orchestration finishes.
- [ ] Live and templated orchestration docs match where required.

---

## Parallelization Map

```text
Stream A (Tracker Workflow Hardening) ──────────┐
                                                 │
Stream B (Task Detail Rail QoL) ────────────────►│
                                                 │
Stream C (Bug Orchestration + Completion Loop) ─►│
                                                 │
                                                 ▼
                                       Phase R8-1 complete
```

---

## Definition of Done

- [ ] Stream A, B, and C acceptance criteria pass.
- [ ] Focused doc-contract, template-parity, and SPA tests pass.
- [ ] Full `npm test` is green.
- [ ] No lint errors in files touched by this phase.
- [ ] `docs/project-progress.md` records Phase 1 completion when implementation finishes.

---

## Test Scenarios

### Happy Path

- [ ] An executing agent loads tracker context, filters tasks by milestone + phase + stream, and updates tracker state only through the HTTP API.
- [ ] A reviewer leaves actionable feedback as tracker comments; an implementer addresses the feedback and replies to those comments.
- [ ] The board loads without a hash and opens a deterministic task in the detail rail.
- [ ] The board loads with a valid hash and opens the hash-selected task.
- [ ] Clicking another task while the detail rail is open immediately swaps the visible task.
- [ ] An orchestrator handles a bug-task stream through execute -> review -> address -> rereview and reruns phase completion until clean.

### Edge Cases

- [ ] An agent attempts to mutate `tasks.db` directly; workflow docs classify this as an anti-pattern and route the agent back to the API.
- [ ] A task has no review comments; addressing workflow does not invent replies.
- [ ] The board has no tasks; default-open behavior does not crash or show stale detail content.
- [ ] The hash points at a missing task; the board falls back to deterministic selection without breaking the rail.
- [ ] A phase-completion pass reveals bugs twice; orchestration delegates execution twice and reruns completion after each bug batch.
