# Phase 2 — Alignment & PRD Flow Rework Plan

**Status**: Planning
**Revision**: Revision 3 — SRS Integration
**Task ID Prefix**: R3-2

---

## Goals

- PRD creation supports a two-stage workflow where the body is drafted first and milestones are added only after the SRS exists
- PRD milestones carry SRS traceability markers so agents and users can trace features back to requirements
- The alignment flow creates the SRS as a first-class document between the PRD body and milestone planning
- SRS creation during alignment uses its own questioning cycle to probe features from the user, not distillation from the PRD
- Greenfield projects (EMPTY state) follow the same two-stage PRD + SRS sequence as existing projects

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 3 Phase 1 — SRS Module & Structural Registration (srs-planning.md exists, structural registration complete) | Complete |
| srs-planning.md defines SRS creation rules, Q&A process, and document structure | Complete |
| prd-planning.md currently defines single-pass PRD creation (will be reworked in this phase) | Available |
| alignment.md currently defines 3+1 document production sequence (will be reworked in this phase) | Available |

---

## Gate R3-2.0 — Two-Stage PRD Contract

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-2.0.1 | Rework `prd-planning.md` PRDProcess to define Stage 1 (body-only: Overview, Target Users, Platform & Experience) and Stage 2 (add Milestones section with SRS requirement references); add a strict STOP instruction after Stage 1 directing agents to complete SRS planning before proceeding; update PRDPrinciples "does NOT contain" list to permit SRS traceability IDs as an exception. Update both live and template copies. | 1.0 | None | Independent |
| R3-2.0.2 | Update PRDTemplate to show two-stage structure — Stage 1 template covers Overview through Platform & Experience only; Stage 2 template adds the Milestones section with a "Relevant requirements: SRS-xxx, SRS-yyy" line below each milestone title and above feature bullets. Update both live and template copies. | 0.75 | R3-2.0.1 | Dependent |
| R3-2.0.3 | Update PRDExample (MealBoard) to show SRS requirement references on each milestone using IDs from the existing SRS example (SRS-001 through SRS-006). Update both live and template copies. | 0.5 | R3-2.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] `prd-planning.md` defines Stage 1 (body-only) and Stage 2 (milestones with SRS refs) as explicit process steps
- [ ] A strict STOP instruction prevents agents from adding milestones before SRS planning is complete
- [ ] PRDPrinciples permits SRS traceability IDs while maintaining the "no document references" rule for everything else
- [ ] PRDTemplate shows the two-stage split with "Relevant requirements:" syntax below milestone titles
- [ ] PRDExample demonstrates SRS IDs on MealBoard milestones consistent with the existing SRS example

---

## Stream A — Alignment Flow Rework

> Rework alignment.md analysis and document production to create the SRS between the PRD body and milestones.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-2.A.1 | Update alignment.md STEP 2 (analysis) to explicitly extract and structure feature names and descriptions from knowledge base, codebase, and git history as named SRS population leads — these become the starting context for SRS Q&A, not the SRS itself. Update both live and template copies. | 0.75 | Gate | Dependent |
| R3-2.A.2 | Rework alignment.md DocumentProduction from a 3+1 sequence to a 5+1 sequence: (1) conventions, (2) PRD body via prd-planning.md Stage 1, (3) SRS via srs-planning.md with its own Q&A cycle using analysis features as leads, (4) PRD milestones via prd-planning.md Stage 2 grouping SRS requirements into milestones, (5) first milestone doc, (6) project-progress. Update document count, one-at-a-time rule, and ordering commentary accordingly. Update both live and template copies. | 1.5 | R3-2.A.1 | Dependent |
| R3-2.A.3 | Update alignment.md EMPTY state handling in AlignmentFlow so greenfield projects no longer skip directly to full prd-planning.md but instead follow the same PRD body → SRS Q&A → PRD milestones sequence, with SRS questioning probing features from the user independently rather than distilling from the PRD body. Update both live and template copies. | 0.75 | R3-2.A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] alignment.md analysis step produces structured feature leads for SRS population
- [ ] DocumentProduction sequence is conventions → PRD body (Stage 1) → SRS → PRD milestones (Stage 2) → first milestone → project-progress
- [ ] SRS creation has its own Q&A cycle — features are probed from the user, not distilled from the PRD body
- [ ] EMPTY state follows the same two-stage PRD + SRS sequence as existing projects
- [ ] The one-document-at-a-time rule applies to each step in the new sequence

---

## Parallelization Map

```text
Gate R3-2.0 (Two-Stage PRD Contract) ──────────────────────────────┐
                                                                    │
Stream A (Alignment Flow Rework) ─────────────────────────────────► │
                                                                    │
                                                                    ▼
                                                          Phase 2 complete
```

---

## Definition of Done

- [ ] Gate R3-2.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] `prd-planning.md` defines a strict two-stage creation workflow with SRS traceability
- [ ] `alignment.md` produces the SRS as a first-class document with its own Q&A cycle
- [ ] PRD milestones show "Relevant requirements:" SRS ID references below milestone titles
- [ ] Greenfield and existing projects follow the same document production sequence
- [ ] Live `docs/core/` and `templates/docs/core/` copies match for all modified files

---

## Test Plan

> Generated from task analysis. All tasks in this phase are protocol
> documentation changes (markdown rewrites) with no runtime behavior.
> Verification is manual via the Test Scenarios below.

### Gate R3-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-2.0.1 | — | Not testable: protocol documentation rewrite, no runtime behavior | — |
| — | R3-2.0.2 | — | Not testable: template content update, no runtime behavior | — |
| — | R3-2.0.3 | — | Not testable: example content update, no runtime behavior | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-2.A.1 | — | Not testable: protocol documentation rewrite, no runtime behavior | — |
| — | R3-2.A.2 | — | Not testable: protocol documentation rewrite, no runtime behavior | — |
| — | R3-2.A.3 | — | Not testable: protocol documentation rewrite, no runtime behavior | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R3-2.0 | 3 | 0 | 3 |
| Stream A | 3 | 0 | 3 |
| **Total** | **6** | **0** | **6** |

---

## Test Scenarios

### Happy Path

- [ ] `prd-planning.md` Stage 1 produces a PRD body without milestones and stops
- [ ] SRS creation in alignment follows its own Q&A round, not PRD distillation
- [ ] `prd-planning.md` Stage 2 adds milestones with SRS requirement references to an existing PRD body
- [ ] MealBoard PRD example shows SRS IDs on milestones matching the existing SRS example

### Edge Cases

- [ ] Agent cannot skip SRS creation between PRD body and milestones — STOP instruction enforced
- [ ] EMPTY state projects follow the full two-stage sequence rather than dispatching directly to full prd-planning.md
- [ ] SRS traceability IDs do not violate PRD's "no document references" principle (they are requirement identifiers, not document refs)
- [ ] A PRD created via Stage 1 only (without milestones yet) is a valid intermediate state

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R3-2.TW1), lists affected tasks, and includes test impact.

_None._
