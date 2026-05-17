# Phase 1 — Structural & SRS Foundation Plan

**Status**: Planning
**Milestone**: Revision 4 — Anti-Patterns

---

## Goals

- Formally track Revision 4 as active in the project progress document
- Define the new SRS requirements for the documentation updates

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 4 — Anti-Patterns milestone plan exists | Complete |

---

## Gate 1.0 — Project Progress Update

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-1.0.1 | Update `docs/project-progress.md` to mark Revision 4 as in progress | 0.25 | None | Independent |

### Gate Acceptance Criteria

- [ ] `docs/project-progress.md` reflects Revision 4 as in progress

---

## Stream A — SRS Requirement Definitions

> Updates the Software Requirements Specification to formalize the new constraints and modules.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-1.A.1 | Add new requirements superseding MAS-177 and MAS-178 to `docs/srs.md` | 0.5 | Gate | Dependent |
| R4-1.A.2 | Add MAS-200 (formalizing `git-execution-workflow.md`) to `docs/srs.md` | 0.25 | Gate | Dependent |

### Stream A Acceptance Criteria

- [ ] `docs/srs.md` contains the new requirement constraints (superseding MAS-177/178)
- [ ] `docs/srs.md` lists MAS-200, defining `git-execution-workflow.md` as a core module

---

## Parallelization Map

```text
Gate 1.0 (Progress Update) ───────────────┐
                                          │
             ┌────────────────────────────┤
             │                            │
Stream A (SRS Updates) ───────────────────► Phase 1 complete
```

---

## Definition of Done

- [ ] Gate 1.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass

---

## Test Scenarios

### Happy Path
- [ ] `blueprint context` or manual inspection shows Revision 4 is active
- [ ] `docs/srs.md` contains the newly defined requirement records

### Edge Cases
- [ ] None for this documentation-only phase
