# Tweak 4 — Orchestration Bug and Tweak Scope

> Superseded by Revision 8 Phase 1 — Quality of Life Workflow Hardening.
> This document remains as an audit record; executable work moved to
> `docs/milestones/revision-8-tweak-revamp-qol/phase-1-quality-of-life-workflow-hardening.md`.

Add formal orchestration language for bug tasks and tweak tasks so they are treated like stream orchestration and use the same execute, review, address, and rereview loop as other orchestrated work.

---

## Goals

- Make it explicit that orchestration can coordinate bug-task work.
- Make it explicit that orchestration can coordinate tweak-task work.
- State that bug orchestration and tweak orchestration are similar to stream orchestration.
- Reuse the existing orchestration lifecycle instead of defining a special bug or tweak loop.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 5 — Orchestration Protocol complete | Complete |
| Revision 6 — Built-in Task Tracker complete | Complete |
| Revision 7 — Standalone Tweak Workflow complete | Complete |

---

## Tasks

| Task ID | Task | Dependencies |
|---------|------|--------------|
| TW4.1 | Add formal `docs/core/orchestrate.md` language stating that bug-task orchestration is similar to stream orchestration and may use the existing stream lifecycle. | None |
| TW4.2 | Add formal `docs/core/orchestrate.md` language stating that tweak-task orchestration is similar to stream orchestration and may use the existing stream lifecycle. | TW4.1 |
| TW4.3 | Clarify that bug and tweak orchestration use the same execute -> review -> address -> rereview loop as stream orchestration and do not define a separate lifecycle. | TW4.1, TW4.2 |
| TW4.4 | Mirror the orchestration scope language into `templates/docs/core/orchestrate.md`. | TW4.1-TW4.3 |
| TW4.5 | Refresh focused orchestration doc-contract tests for bug-task scope, tweak-task scope, loop reuse, and live/template parity. | TW4.4 |

---

## Acceptance Criteria

- [ ] `docs/core/orchestrate.md` explicitly says bug tasks can be coordinated by orchestration.
- [ ] `docs/core/orchestrate.md` explicitly says tweak tasks can be coordinated by orchestration.
- [ ] `docs/core/orchestrate.md` says bug-task orchestration is similar to stream orchestration.
- [ ] `docs/core/orchestrate.md` says tweak-task orchestration is similar to stream orchestration.
- [ ] Bug-task orchestration and tweak-task orchestration both point to the existing stream-style `execute -> review -> address -> rereview` lifecycle.
- [ ] The orchestration docs do not introduce a separate bug-only or tweak-only lifecycle.
- [ ] `templates/docs/core/orchestrate.md` matches the live orchestration document.
- [ ] Focused tests cover the new formal language and template parity.

---

## Verification

- Update focused orchestration doc-contract tests under `tests/revision-5/` or the nearest existing orchestration/template coverage.
- Run the focused tests plus `npm test`.

---

## Definition of Done

- [ ] All acceptance criteria met.
- [ ] The implemented change is additive guidance, not a full orchestration rewrite.
- [ ] Live and templated orchestration docs match where required.
- [ ] `npm test` is green for the project.

---

## Status

Superseded by Revision 8 Phase 1.
