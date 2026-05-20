# Tweak 5 — Pre-Task Tweak Confirmation Gate

Tighten tweak planning so no board tasks are created until the user has manually confirmed the drafted tweak plan.

---

## Goals

- Move the mandatory user confirmation gate before tracker task creation.
- Prevent unconfirmed tweak drafts from creating board noise.
- Add an anti-pattern that forbids creating board tasks before manual confirmation.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 7 — Standalone Tweak Workflow complete | Complete |

---

## Tasks

| Task ID | Task | Dependencies |
|---------|------|--------------|
| TW5.1 | Update `docs/core/tweak-planning.md` so the tweak review gate requires manual user confirmation before tracker task creation. | None |
| TW5.2 | Update `docs/core/tweak-planning.md` process ordering so tracker task creation happens only after the confirmed draft. | TW5.1 |
| TW5.3 | Add a `docs/core/tweak-planning.md` anti-pattern forbidding board task creation for unconfirmed tweak drafts. | TW5.1 |
| TW5.4 | Mirror the tweak-planning gate changes into `templates/docs/core/tweak-planning.md`. | TW5.1-TW5.3 |
| TW5.5 | Refresh focused tweak-planning doc-contract tests for pre-task confirmation, process ordering, anti-pattern guidance, and live/template parity. | TW5.4 |

---

## Acceptance Criteria

- [ ] `docs/core/tweak-planning.md` states that no board/tracker tasks may be created until the user manually confirms the drafted tweak plan.
- [ ] The tweak workflow ordering drafts the tweak document first, presents it to the user, waits for explicit confirmation, and only then creates tracker tasks.
- [ ] `docs/core/tweak-planning.md` includes an anti-pattern that rejects creating tracker tasks for unconfirmed tweak drafts.
- [ ] The stricter gate still requires confirmed tracker tasks to remain in `TO-DO` until execution begins.
- [ ] `templates/docs/core/tweak-planning.md` matches the live tweak-planning document.
- [ ] Focused tests cover the gate ordering, anti-pattern, and template parity.

---

## Verification

- Update focused tweak-planning contract tests under `tests/gate-r7-1-0/`, `tests/revision-7/`, or the nearest existing tweak-planning coverage.
- Run the focused tests plus `npm test`.

---

## Definition of Done

- [ ] All acceptance criteria met.
- [ ] No tracker tasks are created for draft tweaks before manual user confirmation.
- [ ] Live and templated tweak-planning docs match where required.
- [ ] `npm test` is green for the project.

---

## Status

Confirmed. Tracker tasks may be created under the confirmed-plan gate.
