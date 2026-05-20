# Tweak 3 — Task Detail Default Open

> Superseded by Revision 8 Phase 1 — Quality of Life Workflow Hardening.
> This document remains as an audit record; executable work moved to
> `docs/milestones/revision-8-tweak-revamp-qol/phase-1-quality-of-life-workflow-hardening.md`.

Open the task-detail rail by default so the board starts in a detail-visible state instead of a collapsed state.

---

## Goals

- Make the task-detail rail visible on first board load.
- Preserve explicit task selection behavior instead of opening an empty collapsed rail.
- Keep hash-based task selection authoritative when a task is already named in the URL.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 6 Phase 2 — Board SPA complete | Complete |
| `[BUG] Task rail quick-swap` resolved | Pending |

---

## Tasks

| Task ID | Task | Dependencies |
|---------|------|--------------|
| TW3.1 | Define the default-open selection behavior for the board rail, preserving URL-hash selection when present. | None |
| TW3.2 | Update the SPA state/components and focused rail tests so the board boots with the rail open by default. | TW3.1 |

---

## Acceptance Criteria

- [ ] When the board loads with a valid `#task=<id>` hash, that task remains selected and the rail is open.
- [ ] When the board loads without a task hash, the board chooses a deterministic initial selected task and opens the rail automatically.
- [ ] The default-open behavior is covered by focused SPA tests and does not regress manual close/select flows.

---

## Verification

- Update the focused SPA selection / rail tests under `tests/spa/rail/`, `tests/spa/board/`, and any store tests that assert initial selection behavior.
- Run the focused SPA suites plus `npm test`.

---

## Definition of Done

- [ ] All acceptance criteria met.
- [ ] Default-open behavior and manual selection behavior both remain covered.
- [ ] Hash-driven deep links still work.
- [ ] `npm test` is green for the project.

---

## Status

Superseded by Revision 8 Phase 1.
