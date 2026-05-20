# Tweak 2 — Tracker Workflow Contract Hardening

Align session-start, execution, review, and git workflows around additive tracker API and comment-first anti-pattern guidance.

---

## Goals

- Make `docs/core/tracker.md` part of the default operating context for tracker-backed work.
- Add anti-pattern guidance that forbids direct `tasks.db` manipulation anywhere an agent can mutate tracker state.
- Add focused workflow guidance for filtered task lookup, comment-first review, and comment replies without rewriting the workflows.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 6 — Built-in Task Tracker complete | Complete |
| Revision 7 — Standalone Tweak Workflow complete | Complete |

---

## Tasks

| Task ID | Task | Dependencies |
|---------|------|--------------|
| TW2.1 | Add session-start guidance so populated tracker-backed projects load `docs/core/tracker.md`. | None |
| TW2.2 | Add an API-only tracker mutation anti-pattern to `docs/core/execution.md`. | TW2.1 |
| TW2.3 | Add an API-only tracker mutation anti-pattern to `docs/core/review.md`. | TW2.1 |
| TW2.4 | Add an API-only tracker mutation anti-pattern to `docs/core/git-execution-workflow.md`. | TW2.1 |
| TW2.5 | Add an API-only tracker mutation anti-pattern to `docs/core/git-review-workflow.md`. | TW2.1 |
| TW2.6 | Add focused `docs/core/execution.md` guidance for retrieving tasks with milestone + phase + stream filters when that context is available. | TW2.2 |
| TW2.7 | Adjust `docs/core/execution.md` task creation guidance so new task descriptions avoid stream-title and `Review Notes` scaffolding. | TW2.2 |
| TW2.8 | Add focused `docs/core/review.md` guidance requiring actionable review feedback to be left as tracker comments. | TW2.3 |
| TW2.9 | Add focused `docs/core/execution.md` `ApplyReviewNotes` guidance telling implementers to reply to reviewer comments when addressing them. | TW2.8 |
| TW2.10 | Mirror `docs/core/execution.md` additions into `templates/docs/core/execution.md`. | TW2.2, TW2.6, TW2.7, TW2.9 |
| TW2.11 | Mirror `docs/core/review.md` additions into `templates/docs/core/review.md`. | TW2.3, TW2.8 |
| TW2.12 | Mirror git workflow anti-pattern additions into `templates/docs/core/git-execution-workflow.md` and `templates/docs/core/git-review-workflow.md`. | TW2.4, TW2.5 |
| TW2.13 | Refresh focused doc-contract tests for the session-start, API-only, filtered lookup, comment, reply, and template-mirror guidance. | TW2.1-TW2.12 |

---

## Acceptance Criteria

- [ ] Session start loads `docs/core/tracker.md` alongside the existing required startup context for populated projects.
- [ ] `docs/core/execution.md`, `docs/core/review.md`, `docs/core/git-execution-workflow.md`, and `docs/core/git-review-workflow.md` each include an anti-pattern forbidding direct manipulation of `docs/.blueprint/tasks.db` for tracker state changes.
- [ ] The anti-patterns say tracker mutation must happen through the tracker HTTP API recipes in `docs/core/tracker.md`.
- [ ] `docs/core/execution.md` adds focused guidance to retrieve stream work with milestone + phase + stream filters when that context is available.
- [ ] `docs/core/execution.md` task creation guidance no longer instructs agents to add a `Review Notes:` block or bake the stream title into the `Gate/Stream:` line.
- [ ] `docs/core/review.md` adds focused guidance requiring actionable review feedback to be left as tracker comments, not task description prose.
- [ ] `docs/core/execution.md` `ApplyReviewNotes` adds guidance telling the implementer to reply to reviewer comments when addressing them.
- [ ] Live and templated tracker-facing docs stay in sync and focused protocol tests cover the additive guidance.

---

## Verification

- Update the tracker protocol doc tests under `tests/revision-6/stream-a/`, `tests/revision-6/stream-b/`, and any session-start routing coverage affected by the new startup requirement.
- Run the focused doc-contract suites plus `npm test`.

---

## Definition of Done

- [ ] All acceptance criteria met.
- [ ] Tracker-facing live docs and templates agree where required.
- [ ] The implemented change is additive guidance, not a full workflow rewrite.
- [ ] The comment-first review/addressing flow is documented end-to-end.
- [ ] `npm test` is green for the project.

---

## Status

Confirmed.
