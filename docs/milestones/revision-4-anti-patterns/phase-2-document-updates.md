# Phase 2 — Document Updates (Alignment, SRS, Milestone) Plan

**Status**: Planned
**Milestone**: Revision 4 — Anti-Patterns

---

## Goals

- Add the "Don't Rush" anti-pattern to the Alignment module
- Add the "Flat Requirement Lists" and "Checklist-Style" anti-patterns to the SRS module
- Add the "Milestone Bloat" and "Vague Feature Boundaries" anti-patterns to the Milestone module
- Ensure all live `docs/core/` and scaffolded `templates/docs/core/` files remain perfectly synchronized

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 1 — Structural & SRS Foundation | Complete |

---

## Gate 2.0 — Alignment Module Updates

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-2.0.1 | Add "Don't Rush" anti-pattern to `docs/core/alignment.md` | 0.5 | None | Independent |
| R4-2.0.2 | Sync changes to `templates/docs/core/alignment.md` | 0.25 | R4-2.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/alignment.md` contains the new "Don't Rush" pointer within the Anti-Patterns section
- [ ] `templates/docs/core/alignment.md` matches the live document exactly

---

## Stream A — SRS Module Updates

> Updates the SRS planning module to prevent flat requirement lists and checklist-style execution.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-2.A.1 | Add anti-patterns (MAS-201, MAS-202) to `docs/core/srs-planning.md` | 0.75 | Gate | Dependent |
| R4-2.A.2 | Sync changes to `templates/docs/core/srs-planning.md` | 0.25 | R4-2.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `docs/core/srs-planning.md` explicitly warns against "Flat Requirement Lists"
- [ ] `docs/core/srs-planning.md` explicitly warns against treating SRS as a checklist
- [ ] `templates/docs/core/srs-planning.md` matches the live document exactly

---

## Stream B — Milestone Module Updates

> Updates the milestone planning module to prevent bloat and enforce clear feature boundaries.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R4-2.B.1 | Add "Milestone Bloat" and "Vague Boundaries" anti-patterns to `docs/core/milestone-planning.md` | 0.75 | Gate | Dependent |
| R4-2.B.2 | Sync changes to `templates/docs/core/milestone-planning.md` | 0.25 | R4-2.B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] `docs/core/milestone-planning.md` explicitly warns against "Milestone Bloat"
- [ ] `docs/core/milestone-planning.md` explicitly warns against "Vague Feature Boundaries"
- [ ] `templates/docs/core/milestone-planning.md` matches the live document exactly

---

## Parallelization Map

```text
Gate 2.0 (Alignment) ─────────────────────┐
                                          │
             ┌────────────────────────────┤
             │                            │
Stream A (SRS Updates) ───────────────────► Phase 2 complete
Stream B (Milestone Updates) ─────────────► Phase 2 complete
```

---

## Test Plan

> Generated from task analysis. This phase is documentation-heavy, but
> the required anti-pattern additions and live/template synchronization
> are verifiable through targeted file-content and parity checks.

### Gate R4-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R4-2.0.1.1 | R4-2.0.1 | unit | Verify `docs/core/alignment.md` contains an `Anti-Patterns` section with the new "Don't Rush" guidance | The live Alignment module includes the new anti-pattern in the correct section |
| T-R4-2.0.2.1 | R4-2.0.2 | unit | Verify `templates/docs/core/alignment.md` matches `docs/core/alignment.md` exactly after the update | No drift exists between the live and scaffolded Alignment module |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R4-2.A.1.1 | R4-2.A.1 | unit | Verify `docs/core/srs-planning.md` explicitly warns against "Flat Requirement Lists" within `Anti-Patterns` | The live SRS planning module contains the flat-list anti-pattern guidance |
| T-R4-2.A.1.2 | R4-2.A.1 | unit | Verify `docs/core/srs-planning.md` explicitly warns against checklist-style SRS execution within `Anti-Patterns` | The live SRS planning module contains the checklist-style anti-pattern guidance |
| T-R4-2.A.2.1 | R4-2.A.2 | unit | Verify `templates/docs/core/srs-planning.md` matches `docs/core/srs-planning.md` exactly after the update | No drift exists between the live and scaffolded SRS planning module |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R4-2.B.1.1 | R4-2.B.1 | unit | Verify `docs/core/milestone-planning.md` explicitly warns against "Milestone Bloat" within `Anti-Patterns` | The live milestone planning module contains the milestone-bloat anti-pattern guidance |
| T-R4-2.B.1.2 | R4-2.B.1 | unit | Verify `docs/core/milestone-planning.md` explicitly warns against "Vague Feature Boundaries" within `Anti-Patterns` | The live milestone planning module contains the vague-boundaries anti-pattern guidance |
| T-R4-2.B.2.1 | R4-2.B.2 | unit | Verify `templates/docs/core/milestone-planning.md` matches `docs/core/milestone-planning.md` exactly after the update | No drift exists between the live and scaffolded milestone planning module |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R4-2.0 | 2 | 2 | 0 |
| Stream A | 2 | 2 | 0 |
| Stream B | 2 | 2 | 0 |
| **Total** | **6** | **6** | **0** |

---

## Definition of Done

- [ ] Gate 2.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] No regression in core module structure
- [ ] All tests in the Test Plan pass

---

## Test Scenarios

### Happy Path
- [ ] The Alignment, SRS planning, and milestone planning live docs each contain their newly planned Anti-Patterns guidance in the correct section.
- [ ] Each corresponding `templates/docs/core/` file matches its live `docs/core/` source exactly after the update.
- [ ] A newly scaffolded project would inherit the same anti-pattern guidance from the synced template files.

### Edge Cases
- [ ] Verification fails if an anti-pattern label is added outside the intended `Anti-Patterns` section or omitted from the live document entirely.
- [ ] Verification fails if any template copy drifts from its live `docs/core/` counterpart, even when the wording is only slightly different.

---
