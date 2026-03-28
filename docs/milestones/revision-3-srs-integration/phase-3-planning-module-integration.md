# Phase 3 — Planning Module Integration Plan

**Status**: Planning
**Revision**: Revision 3 — SRS Integration
**Task ID Prefix**: R3-3

---

## Goals

- Milestone planning reads the relevant SRS slice, broadens previously concise requirements in the same planning cycle, and updates `docs/srs.md` before the milestone plan is finalized
- Milestone planning assigns each in-scope SRS requirement under the milestone to a specific phase, splitting broad requirements into atomic sub-requirements first when needed
- Phase planning reads the relevant SRS requirements, assigns sub-requirements to streams where applicable, and updates the SRS mainly through shared data-schema and technical-structure detail without re-stating the module's existing general planning guidance
- Additive scope changes and modifying revisions preserve SRS identity rules so "same meaning" keeps the same requirement ID and "materially changed meaning" creates a superseding requirement with audit links

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 3 Phase 1 — SRS Module & Structural Registration (SRS module, identity rules, and structural registration complete) | Complete |
| Revision 3 Phase 2 — Alignment & PRD Flow Rework (PRD uses Stage 1/Stage 2 flow and milestone-level SRS references) | Complete |
| `docs/core/srs-planning.md` defines requirement IDs, audit trace, supersession, and shared data schema rules | Complete |
| `docs/core/milestone-planning.md`, `docs/core/phase-planning.md`, `docs/core/scope-change.md`, and `docs/core/revision-planning.md` do not yet integrate SRS update behavior | Confirmed |
| Phase 3 may refine `docs/core/srs-planning.md` if needed to establish the final baseline that downstream planning modules follow | Confirmed |
| Milestone planning should broaden concise requirements and assign each in-scope requirement to a specific phase | Confirmed |
| Phase planning should assign sub-requirements to streams where applicable and should update the SRS mainly through schema, migration, and data-structure detail | Confirmed |
| Phase-planning edits in this phase must stay tightly scoped to SRS-specific additions and must not re-emphasize guidance the module already states | Confirmed |
| Revision-planning SRS handling is part of this final phase and is no longer deferred | Confirmed |

---

## Gate R3-3.0 — Requirement Mapping Baseline

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-3.0.1 | Update live and template `srs-planning.md` to define the final baseline used by downstream planning modules: milestone-level broadening and splitting, requirement-to-phase and sub-requirement-to-stream traceability, schema-centered phase updates, and same-meaning versus superseding-change rules | 1.0 | None | Independent |

### Gate Acceptance Criteria

- [ ] `docs/core/srs-planning.md` and `templates/docs/core/srs-planning.md` define how concise requirements are broadened, how broad requirements split into atomic sub-requirements, and how requirement traceability flows from milestone slice to phase assignment to stream assignment
- [ ] `docs/core/srs-planning.md` and `templates/docs/core/srs-planning.md` define that phase-planning SRS updates are mainly schema, migration, data-structure, and architecture elaboration when requirement meaning stays the same
- [ ] `docs/core/srs-planning.md` and `templates/docs/core/srs-planning.md` define that same meaning keeps the same SRS ID while materially changed meaning creates a superseding SRS ID with audit links

---

## Stream A — Milestone Planning & Inline SRS Elaboration

> Integrate SRS reading and requirement elaboration directly into milestone planning.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-3.A.1 | Update live and template `milestone-planning.md` preconditions and question flow so milestone planning loads `docs/srs.md`, reads the milestone's referenced SRS slice, and uses concise, under-specified, or overly broad requirements as explicit prompts for user clarification | 1.0 | Gate | Dependent |
| R3-3.A.2 | Update live and template `milestone-planning.md` drafting rules so milestone planning must broaden concise requirements in `docs/srs.md` once their meaning is understood, including splitting broad requirements into atomic sub-requirements before finalizing phase grouping | 1.25 | R3-3.A.1 | Dependent |
| R3-3.A.3 | Add milestone-planning guidance to assign each in-scope SRS requirement to a specific phase and update the shared SRS Data Schema at the entity/domain level when milestone planning clarifies product structure, while keeping milestone docs themselves at milestone-level granularity | 1.0 | R3-3.A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] Milestone planning treats the SRS as a required source document, not optional context
- [ ] Concise, under-specified, or overly broad SRS requirements become explicit milestone-planning question leads
- [ ] Once a requirement is fully understood at milestone level, the SRS is broadened or refined in the same planning cycle before the milestone plan is considered complete
- [ ] Broad requirement titles can be split into atomic SRS sub-requirements before phase grouping proceeds
- [ ] When a milestone contains multiple in-scope SRS requirements, each requirement is assigned to a specific planned phase
- [ ] When a milestone begins with only one in-scope SRS requirement but the work spans multiple phases, milestone planning first broadens or splits that requirement into phase-ownable requirement slices before assigning them across phases
- [ ] Milestone planning can extend the shared SRS Data Schema at the entity/domain level without turning the milestone doc into a technical implementation plan

---

## Stream B — Phase Planning SRS Technical Elaboration

> Add only the SRS-specific technical-clarification behavior phase planning needs.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-3.B.1 | Update live and template `phase-planning.md` preconditions and questioning notes so phase planning reads the relevant SRS requirements plus milestone-assigned requirement slice and uses them as the source for SRS-targeted technical clarification prompts | 0.75 | Gate | Dependent |
| R3-3.B.2 | Add tightly scoped live and template `phase-planning.md` guidance for assigning phase sub-requirements to streams where applicable so the stream structure remains traceable back to the SRS slice | 0.75 | R3-3.B.1 | Dependent |
| R3-3.B.3 | Add tightly scoped live and template `phase-planning.md` guidance for when phase planning may update `docs/srs.md`: mainly shared data-schema, migration, data-structure, and architecture detail that preserve the same requirement meaning; materially changed meaning must route through the change-handling path | 1.0 | R3-3.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] Phase planning loads the relevant SRS slice and uses it for SRS-specific technical clarification
- [ ] Phase planning can assign sub-requirements to streams where applicable and keep that mapping traceable to the SRS-backed phase slice
- [ ] Phase-planning edits stay narrowly focused on SRS integration and do not repeat the module's existing general planning guidance
- [ ] Phase planning may add shared schema, migration, data-structure, and architecture detail to the SRS when requirement meaning stays the same
- [ ] Phase planning does not silently change requirement meaning; materially different behavior routes through change handling instead

---

## Stream C — Scope Change SRS Placement Rules

> Ensure additive scope placement updates the SRS as part of the same decision.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-3.C.1 | Update live and template `scope-change.md` so additive placement at any approved level also creates or updates the corresponding SRS requirement entry, including priority, milestone assignment, source, introduction path, and change-log expectations | 1.0 | Gate | Dependent |
| R3-3.C.2 | Add live and template `scope-change.md` rules for planning-discovered sub-requirements: when milestone or phase planning reveals an additive capability hidden inside a broad requirement, the SRS must be updated first before downstream phase or stream planning continues | 0.75 | R3-3.C.1 | Dependent |
| R3-3.C.3 | Add live and template `scope-change.md` rules distinguishing additive SRS growth from modifying behavior so materially changed requirement meaning routes to revision planning instead of being treated as ordinary elaboration | 0.5 | R3-3.C.1 | Dependent |

### Stream C Acceptance Criteria

- [ ] Approved additive scope placement always includes the corresponding SRS update rather than leaving the SRS behind
- [ ] Planning-discovered additive sub-requirements are added to the SRS before downstream phase or stream planning proceeds
- [ ] `scope-change.md` clearly distinguishes additive SRS growth from modifying changes that require revision planning
- [ ] New SRS entries created through scope placement preserve the metadata and audit rules from `srs-planning.md`

---

## Stream D — Revision Planning SRS Impact Analysis

> Teach revision planning how to reason about SRS identity and supersession.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R3-3.D.1 | Update live and template `revision-planning.md` impact analysis so revisions identify affected SRS requirement IDs alongside affected milestones, phases, files, and tests | 0.75 | Gate | Dependent |
| R3-3.D.2 | Add live and template `revision-planning.md` decision rules for SRS impact: same meaning keeps the same SRS ID with updated audit history, while materially changed meaning creates a new superseding SRS requirement with bidirectional links | 1.0 | R3-3.D.1 | Dependent |
| R3-3.D.3 | Update live and template `revision-planning.md` revision-document requirements so SRS implications are captured explicitly when a revision changes requirement meaning, assignment, or supersession state | 0.75 | R3-3.D.2 | Dependent |

### Stream D Acceptance Criteria

- [ ] Revision impact analysis includes the relevant SRS requirement IDs and their expected treatment
- [ ] Revision planning explicitly distinguishes "same meaning" updates from materially changed meaning that requires a new superseding SRS ID
- [ ] Revision documents account for SRS reassignment, supersession, or audit updates when revisions affect requirement meaning
- [ ] SRS handling is no longer deferred from revision planning

---

## Parallelization Map

```text
Gate R3-3.0 (Requirement Mapping Baseline) ────────────────────────────────────┐
                                                                                │
                 ┌───────────────────────────────┬──────────────────────────────┼──────────────────────────────┐
                 │                               │                              │                              │
Stream A (Milestone Planning & Inline SRS Elaboration) ──────────────────────► │                              │
Stream B (Phase Planning SRS Technical Elaboration) ─────────────────────────► │                              │
Stream C (Scope Change SRS Placement Rules) ─────────────────────────────────► │                              │
Stream D (Revision Planning SRS Impact Analysis) ────────────────────────────► │                              │
                                                                                │                              │
                                                                                ▼                              │
                                                                      Phase 3 complete ◄──────────────────────┘
```

---

## Definition of Done

- [ ] Gate R3-3.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] Stream D acceptance criteria pass
- [ ] `docs/core/srs-planning.md` and `templates/docs/core/srs-planning.md` establish the baseline mapping and update rules consumed by the downstream planning modules
- [ ] `docs/core/milestone-planning.md` and `templates/docs/core/milestone-planning.md` both integrate inline SRS elaboration, requirement-to-phase assignment, and same-cycle SRS updates
- [ ] `docs/core/phase-planning.md` and `templates/docs/core/phase-planning.md` integrate only the required SRS-specific stream-mapping and technical elaboration rules
- [ ] `docs/core/scope-change.md` and `templates/docs/core/scope-change.md` update the SRS as part of additive placement decisions
- [ ] `docs/core/revision-planning.md` and `templates/docs/core/revision-planning.md` analyze SRS impact and define supersession handling for meaning changes
- [ ] No remaining SRS-specific planning-module integration is deferred beyond this phase

---

## Test Plan

> Generated from task analysis. All tasks in this phase are protocol
> documentation changes with no direct runtime behavior. Verification
> is manual through the scenarios below.

### Gate R3-3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-3.0.1 | — | Not testable: `srs-planning.md` baseline update captured in protocol prose | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-3.A.1 | — | Not testable: milestone-planning protocol rewrite | — |
| — | R3-3.A.2 | — | Not testable: milestone-level SRS broadening and split rules in planning docs | — |
| — | R3-3.A.3 | — | Not testable: requirement-to-phase assignment and entity/domain-level schema guidance in docs | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-3.B.1 | — | Not testable: phase-planning SRS precondition and question-flow rewrite | — |
| — | R3-3.B.2 | — | Not testable: sub-requirement-to-stream mapping guidance in docs | — |
| — | R3-3.B.3 | — | Not testable: schema-centered SRS update and change-handling boundary rules in docs | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-3.C.1 | — | Not testable: additive SRS placement rules in docs | — |
| — | R3-3.C.2 | — | Not testable: planning-discovered sub-requirement routing rules in docs | — |
| — | R3-3.C.3 | — | Not testable: additive-vs-modifying boundary rewrite in docs | — |

### Stream D Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R3-3.D.1 | — | Not testable: revision impact-analysis rewrite in docs | — |
| — | R3-3.D.2 | — | Not testable: SRS identity and supersession rules in revision docs | — |
| — | R3-3.D.3 | — | Not testable: revision-document SRS requirements in docs | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R3-3.0 | 1 | 0 | 1 |
| Stream A | 3 | 0 | 3 |
| Stream B | 3 | 0 | 3 |
| Stream C | 3 | 0 | 3 |
| Stream D | 3 | 0 | 3 |
| **Total** | **13** | **0** | **13** |

---

## Test Scenarios

### Happy Path

- [ ] Milestone planning reads the PRD-linked SRS slice, broadens concise requirements with the user, updates `docs/srs.md`, assigns each in-scope requirement to a phase, and then finalizes the milestone plan
- [ ] Milestone planning can split a broad requirement into multiple atomic SRS requirements before deciding phase boundaries
- [ ] Phase planning reads the relevant SRS requirements, assigns sub-requirements to streams where applicable, and adds schema-centered technical elaboration without reworking the module's general planning guidance
- [ ] Additive scope placement creates the required SRS entry at the same time the feature is placed
- [ ] Revision planning can explain whether a changed behavior keeps the same SRS ID or produces a new superseding requirement

### Edge Cases

- [ ] A broad requirement title in the SRS is discovered during milestone planning; the workflow splits it into atomic child requirements instead of forcing milestone planning to proceed on an ambiguous requirement
- [ ] Milestone planning starts from a concise requirement title that is too thin for phase assignment; the workflow broadens it in the SRS before phase mapping is finalized
- [ ] Phase planning uncovers field-level schema, migration, or data-structure clarity but not changed requirement meaning; the SRS is updated without creating a new requirement ID
- [ ] Phase planning uncovers materially different intended behavior; the workflow does not silently rewrite the existing SRS entry and instead routes through change handling
- [ ] Scope change adds a new capability inside an existing milestone; the feature is placed and the SRS remains traceable with correct priority, milestone assignment, and audit history
- [ ] A revision changes requirement meaning; revision planning creates a supersession path instead of overwriting history under the original requirement ID

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R3-3.TW1), lists affected tasks, and includes test impact.

_None._
