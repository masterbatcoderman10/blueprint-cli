# Phase 1 — SRS Module & Structural Registration Plan

**Status**: Planning
**Revision**: Revision 3 — SRS Integration
**Task ID Prefix**: R3-1

---

## Goals

- Blueprint gains a first-class SRS module and editable SRS shell that can carry feature intent forward after alignment
- SRS entries have stable identity and audit-trace rules for elaboration, reassignment, supersession, and revision handoff
- New Blueprint projects scaffold `docs/srs.md`, and legacy projects missing it have a repairable compatibility path
- Core protocol docs and agent entry points recognize the SRS layer without pulling Phase 2 and Phase 3 planning-flow rewrites forward

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 3 document exists and fixes Phase 1 scope to structural registration | Complete |
| M1 Phase 2 — Scaffold Engine (template copy and editable shell interpolation) | Complete |
| M1 Phase 3 — Template Integrity (Doctor inventory, audit, and repair flows) | Complete |
| M1 Phase 4 — Testing & Release Readiness (test harness and packaged template verification) | Complete |
| Alignment, PRD, milestone-planning, phase-planning, and scope-change flow rewrites are deferred to Revision 3 Phases 2 and 3 | Confirmed |
| Legacy Blueprint projects without `docs/srs.md` need an actionable compatibility path in this phase | Confirmed |
| Tweaks and bug fixes must not update the SRS by default | Confirmed |

---

## Gate R3-1.0 — SRS Contract Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-1.0.1 | Define the SRS requirement identity contract: stable requirement ID format, required metadata fields, status vocabulary, audit-trace expectations, reassignment rules, supersession links, and the tweak/bug no-touch boundary | 1.0 | None | Independent |
| R3-1.0.2 | Create live `docs/core/srs-planning.md` describing SRS purpose, progressive elaboration, document structure, initial creation, additive requirement insertion, milestone reassessment, revision handoff, and audit-trace rules | 1.5 | R3-1.0.1 | Dependent |
| R3-1.0.3 | Create `templates/docs/core/srs-planning.md` as the scaffolded copy of the live module | 0.25 | R3-1.0.2 | Dependent |
| R3-1.0.4 | Create `templates/srs.md` editable shell with `{{project-name}}` interpolation, MoSCoW sections, requirement metadata scaffolding, change-log placeholder, and data schema section | 0.75 | R3-1.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/srs-planning.md` defines stable requirement IDs, audit-trace metadata, additive insertion, reassignment, supersession, revision handoff, and the rule that tweaks and bug fixes do not update the SRS by default
- [ ] `templates/docs/core/srs-planning.md` matches the live module exactly
- [ ] `templates/srs.md` exists as an editable shell with `{{project-name}}` interpolation, MoSCoW structure, requirement metadata scaffolding, change-log placeholder, and data schema placeholder
- [ ] The Phase 1 boundary is explicit: no alignment, PRD, milestone-planning, phase-planning, or scope-change workflow rewrites are introduced here

---

## Stream A — Protocol Surface Registration

> Register the SRS across Blueprint's structural and planning reference surfaces without rewriting downstream planning workflows yet.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-1.A.1 | Update live and template `blueprint-structure.md` to add `docs/srs.md`, register `docs/core/srs-planning.md`, and revise docs-root rules and validation to reflect four required root docs | 0.75 | Gate | Dependent |
| R3-1.A.2 | Update live and template `health-check.md` so structural checks include `docs/srs.md` and document the legacy repair path for Blueprint projects created before SRS integration | 0.75 | Gate | Dependent |
| R3-1.A.3 | Update live and template `planning.md` so the planning progression includes SRS between PRD and milestone planning and module dispatch includes `docs/core/srs-planning.md` | 0.5 | Gate | Dependent |

### Stream A Acceptance Criteria

- [ ] `blueprint-structure.md` lists `docs/srs.md` as a required root doc and `docs/core/srs-planning.md` as a canonical core module
- [ ] `health-check.md` includes `docs/srs.md` in structural validation and gives an actionable compatibility path for legacy projects missing the file
- [ ] `planning.md` represents SRS as its own planning layer and includes `srs-planning.md` in planning dispatch
- [ ] None of the updated protocol docs imply that Phase 2 or Phase 3 planning-flow rewrites are already active

---

## Stream B — Scaffold & Doctor Compatibility

> Make `docs/srs.md` automatic for new projects and repairable, but not drift-enforced, for legacy projects.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-1.B.1 | Update scaffold/template collection logic and tests so `blueprint init` creates `docs/srs.md` and the editable root shell inventory expands from three files to four | 0.75 | Gate | Dependent |
| R3-1.B.2 | Extend Doctor structure, inventory, audit, and repair behavior so missing `docs/srs.md` is a repairable legacy finding while existing user-edited `docs/srs.md` content is excluded from drift enforcement | 1.5 | Gate | Dependent |
| R3-1.B.3 | Add regression coverage for scaffold interpolation, legacy audit/repair of missing `docs/srs.md`, and drift exclusion for customized SRS content | 1.0 | R3-1.B.1, R3-1.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] `blueprint init` scaffolds `docs/srs.md` with project-name interpolation
- [ ] Doctor can identify missing `docs/srs.md` in legacy Blueprint projects as a repairable issue
- [ ] Doctor repair can restore `docs/srs.md` from the bundled template
- [ ] Doctor does not flag user-edited `docs/srs.md` content as drift once the file exists
- [ ] The legacy compatibility path is explicit and test-covered rather than implied

---

## Stream C — Agent Routing & Canonical Template Registration

> Expose the SRS module to agents and lock the new template inventory into regression coverage.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-1.C.1 | Update live and template agent entry points (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`) with an SRS planning/discussion routing row pointing to `docs/core/srs-planning.md` | 0.75 | Gate | Dependent |
| R3-1.C.2 | Update canonical core template inventories and tests to include `srs-planning.md` (18 → 19) and update editable-shell template tests to include `srs.md` | 0.75 | Gate | Dependent |
| R3-1.C.3 | Add focused verification that bundled template resolution can locate both `docs/core/srs-planning.md` and `docs/srs.md` | 0.5 | R3-1.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] All live and template agent entry points route SRS intent to `docs/core/srs-planning.md`
- [ ] Canonical core template inventories and tests include `srs-planning.md` as the nineteenth core module
- [ ] Editable shell template coverage includes `srs.md`
- [ ] Bundled template resolution covers both the new core module and the new editable SRS shell

---

## Parallelization Map

```text
Gate R3-1.0 (SRS Contract Foundation) ──────────────────────────────┐
                                                                     │
                  ┌──────────────────────────────────────────────────┼──────────────────────────┐
                  │                                                  │                          │
Stream A (Protocol Surface Registration) ──────────────────────────► │                          │
Stream B (Scaffold & Doctor Compatibility) ──► B.3 ───────────────► │                          │
Stream C (Agent Routing & Template Registration) ─► C.3 ──────────► │                          │
                                                                     │                          │
                                                                     ▼                          │
                                                           Phase 1 complete ◄──────────────────┘
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate R3-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-1.0.1 | — | Not testable: protocol design contract captured in planning/module prose | — |
| — | R3-1.0.2 | — | Not testable: live protocol documentation, no direct runtime behavior | — |
| T-R3-1.0.3.1 | R3-1.0.3 | unit | `srs-planning.md` is included in the resolved bundled core template paths | `resolveAllCoreTemplatePaths()` returns an entry for `docs/core/srs-planning.md` |
| T-R3-1.0.3.2 | R3-1.0.3 | unit | Template file exists and is non-empty at `templates/docs/core/srs-planning.md` | File exists and begins with a Markdown heading |
| T-R3-1.0.4.1 | R3-1.0.4 | unit | `templates/srs.md` exists and contains `{{project-name}}` | Template exists and includes the project-name token |
| T-R3-1.0.4.2 | R3-1.0.4 | unit | `templates/srs.md` contains MoSCoW headings plus requirement metadata/change-log scaffolding | Template includes the expected section headings and placeholders |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R3-1.A.1.1 | R3-1.A.1 | unit | `blueprint-structure.md` lists `docs/srs.md` at docs root and `docs/core/srs-planning.md` in the canonical core layout | Both files are present in the documented structure |
| T-R3-1.A.1.2 | R3-1.A.1 | unit | Validation rules now describe four required root docs instead of three | Validation/checklist text references four required root docs including `srs.md` |
| T-R3-1.A.2.1 | R3-1.A.2 | unit | `health-check.md` structural checks include `docs/srs.md` | Structural checklist explicitly names `docs/srs.md` |
| T-R3-1.A.2.2 | R3-1.A.2 | unit | `health-check.md` documents the legacy compatibility path for projects missing `docs/srs.md` | The protocol tells the agent/user how to repair rather than leaving the gap ambiguous |
| T-R3-1.A.3.1 | R3-1.A.3 | unit | `planning.md` includes SRS in the granularity progression | SRS appears between PRD and milestone planning |
| T-R3-1.A.3.2 | R3-1.A.3 | unit | `planning.md` module dispatch includes `docs/core/srs-planning.md` | Planning dispatch shows an SRS row pointing to the new module |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R3-1.B.1.1 | R3-1.B.1 | integration | `copyEditableShells()` scaffolds `docs/srs.md` for new projects | The generated project contains `docs/srs.md` |
| T-R3-1.B.1.2 | R3-1.B.1 | integration | `copyEditableShells()` interpolates `{{project-name}}` inside `docs/srs.md` | The scaffolded SRS contains the actual project name |
| T-R3-1.B.1.3 | R3-1.B.1 | unit | Editable-shell template collection tests include `srs.md` as the fourth shell file | Template test inventory includes `srs.md` and updated count |
| T-R3-1.B.2.1 | R3-1.B.2 | unit | Doctor structure marks `docs/srs.md` as a user-owned editable project doc | `isEditableProjectDoc('docs/srs.md')` returns `true` |
| T-R3-1.B.2.2 | R3-1.B.2 | integration | Doctor audit on a legacy project missing `docs/srs.md` returns a repairable finding | Audit reports a missing-structure finding for `docs/srs.md` that can be repaired |
| T-R3-1.B.2.3 | R3-1.B.2 | integration | Doctor does not emit drift findings for customized `docs/srs.md` content | User-edited SRS content is excluded from drift enforcement |
| T-R3-1.B.2.4 | R3-1.B.2 | integration | Doctor repair restores `docs/srs.md` from the bundled template | Repair creates the file and a follow-up audit passes clean for that path |
| T-R3-1.B.3.1 | R3-1.B.3 | integration | Legacy project upgrade path remains stable through audit → repair → re-audit | The project reaches a clean post-repair state without affecting other editable docs |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R3-1.C.1.1 | R3-1.C.1 | unit | All live and template agent entry points contain the SRS routing row | Every agent file references `docs/core/srs-planning.md` for SRS intent |
| T-R3-1.C.2.1 | R3-1.C.2 | unit | Canonical core template list includes `srs-planning.md` and count changes from 18 to 19 | Test inventory matches the new canonical set |
| T-R3-1.C.2.2 | R3-1.C.2 | unit | `templates/docs/core/` contains exactly 19 Markdown protocol files including `srs-planning.md` | Directory listing and count both pass |
| T-R3-1.C.2.3 | R3-1.C.2 | unit | Root editable-shell template coverage includes `srs.md` | Template collection tests include the new shell file |
| T-R3-1.C.3.1 | R3-1.C.3 | unit | `resolveTemplatePath('docs/srs.md')` points to a readable bundled template | The resolved path exists and is non-empty |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R3-1.0 | 4 | 2 | 2 |
| Stream A | 3 | 3 | 0 |
| Stream B | 3 | 3 | 0 |
| Stream C | 3 | 3 | 0 |
| **Total** | **13** | **11** | **2** |

---

## Definition of Done

- [ ] Gate R3-1.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] `docs/core/srs-planning.md` exists in both the live repo and bundled templates
- [ ] `templates/srs.md` exists and scaffolds correctly for new projects
- [ ] Legacy Blueprint projects missing `docs/srs.md` have an explicit, repairable upgrade path
- [ ] User-edited `docs/srs.md` content is not treated as canonical drift once the file exists
- [ ] Blueprint structural and planning docs consistently acknowledge the SRS layer
- [ ] All live and template agent entry points route SRS intent correctly
- [ ] No alignment, PRD, milestone-planning, phase-planning, or scope-change flow rewrites are introduced in this phase
- [ ] No lint or typecheck errors exist in files touched by this phase
- [ ] All tests in the Test Plan pass

---

## Test Scenarios

### Happy Path

- [ ] Running `blueprint init` creates `docs/srs.md` alongside `docs/project-progress.md`, `docs/prd.md`, and `docs/conventions.md`
- [ ] A new Blueprint project contains `docs/core/srs-planning.md` in `docs/core/`
- [ ] Agents can discover the SRS workflow from any supported entry point and route SRS planning intent to `docs/core/srs-planning.md`
- [ ] A legacy Blueprint project missing `docs/srs.md` can be repaired and reaches a clean post-repair state

### Edge Cases

- [ ] Customized `docs/srs.md` content is not overwritten or flagged as drift simply because it differs from the template
- [ ] Health-check guidance for missing `docs/srs.md` is actionable for legacy projects instead of leaving an ambiguous failure
- [ ] The SRS module defines additive insertion, reassignment, and revision handoff rules without prematurely rewriting `scope-change.md` or `revision-planning.md`
- [ ] Tweaks and bug fixes do not instruct agents to mutate the SRS unless the issue escalates into a revision

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R3-1.TW1), lists affected tasks, and includes test impact.

_None._
