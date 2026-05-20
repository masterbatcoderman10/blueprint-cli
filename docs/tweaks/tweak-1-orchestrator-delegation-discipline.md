# Tweak 1 — Orchestrator Delegation Discipline

Tighten orchestration by adding anti-pattern guidance and closeout behavior, without rewriting the orchestration workflow.

---

## Goals

- Add anti-pattern guidance that prevents the orchestrator from acting as executor, reviewer, bug fixer, or prompt engineer.
- Make the existing delegation and phase-completion loop easier to follow through additive guardrails.
- Add a closeout instruction that stops the board after orchestration is finished.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 5 — Orchestration Protocol complete | Complete |
| Revision 6 — Built-in Task Tracker complete | Complete |

---

## Tasks

| Task ID | Task | Dependencies |
|---------|------|--------------|
| TW1.1 | Add an anti-pattern to `docs/core/orchestrate.md` forbidding the orchestrator from executing implementation tasks directly. | None |
| TW1.2 | Add an anti-pattern to `docs/core/orchestrate.md` forbidding the orchestrator from performing review work directly. | TW1.1 |
| TW1.3 | Add an anti-pattern to `docs/core/orchestrate.md` forbidding the orchestrator from diagnosing or fixing phase-completion bugs directly. | TW1.1 |
| TW1.4 | Add an anti-pattern to `docs/core/orchestrate.md` forbidding oversized custom subagent prompts and requiring minimal action + phase/stream context. | TW1.1 |
| TW1.5 | Add orchestration closeout guidance telling the orchestrator to stop the board after phase or stream orchestration finishes. | TW1.1 |
| TW1.6 | Mirror the additive orchestration guidance into `templates/docs/core/orchestrate.md`. | TW1.1-TW1.5 |
| TW1.7 | Refresh focused orchestration doc-contract tests for anti-pattern guidance, board closeout, and live/template parity. | TW1.6 |

---

## Acceptance Criteria

- [ ] `docs/core/orchestrate.md` adds anti-patterns that explicitly reject orchestrator execution, orchestrator review, orchestrator bug fixing after phase completion, and complex custom subagent prompts.
- [ ] The anti-patterns direct the orchestrator back to the existing delegate workflows: `execution.md`, `review.md`, `bug-resolution.md`, and `phase-completion.md`.
- [ ] The oversized-prompt anti-pattern tells the orchestrator to name only the action (`execute`, `review`, `address`, `rereview`, or `phase completion`) plus the relevant phase/stream context.
- [ ] `docs/core/orchestrate.md` includes a closeout instruction to stop the board after orchestration finishes.
- [ ] `templates/docs/core/orchestrate.md` matches the live document and focused tests cover the additive anti-pattern / closeout guidance.

---

## Verification

- Update the orchestration protocol tests under `tests/revision-5/` and any mirrored-doc coverage that asserts `docs/core/orchestrate.md` / `templates/docs/core/orchestrate.md`.
- Run the focused orchestration and template tests plus `npm test`.

---

## Definition of Done

- [ ] All acceptance criteria met.
- [ ] Live and templated orchestration docs match where required.
- [ ] The implemented change is additive guidance, not a full orchestration rewrite.
- [ ] Tracker tasks remain fully traceable through delegated execution/review behavior.
- [ ] `npm test` is green for the project.

---

## Status

Complete.
