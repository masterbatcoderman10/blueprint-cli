# Revision 3 — SRS Integration

> Introduce a Software Requirements Specification (SRS) document as a persistent, progressive source of truth that bridges the high-level PRD and detailed phase plans, ensuring feature knowledge from the knowledge base is carried forward throughout the project lifecycle.

---

## What Is Changing

Blueprint currently has a gap between the PRD (one-liner feature bullets per milestone) and phase plans (technical tasks with gate/stream structure). The knowledge base is only consulted during alignment — its feature details are not carried forward into planning. Milestones in the PRD describe scope too thinly for agents to know what to ask about during later planning stages.

This revision adds:

1. A new required docs-root file (`docs/srs.md`) — the SRS document using MoSCoW prioritization with progressive elaboration
2. A new core module (`docs/core/srs-planning.md`) defining how to create, structure, and update the SRS
3. A reworked alignment flow where the PRD body is created first (without milestones), then the SRS, then the milestone plan is generated from SRS analysis
4. PRD milestone entries that reference SRS requirement IDs for traceability
5. Milestone planning that reads, questions about, and elaborates SRS features — updating the SRS alongside the milestone document
6. Phase planning that reads SRS features for technical elaboration — updating the SRS with architecture details and field-level data schema
7. Scope change handling that creates new SRS entries when additive features are placed
8. Structural registration of the SRS across health checks, blueprint structure, agent routing, scaffold engine, and tests

## Why

- **Knowledge base goes stale**: After alignment, the KB is never referenced again. Feature descriptions, data layouts, and context from planning documents are lost to agents in later sessions.
- **PRD is too light**: A one-liner bullet ("Import recipes from a URL with automatic parsing") tells the agent nothing about how import works, what parsing produces, or what edge cases exist. Agents either guess or ask from scratch every time.
- **No progressive bridge**: Milestones jump straight from vague PRD bullets to detailed phase tasks. There is no document that holds the intermediate level — what each feature does (not how to build it, but what it does).
- **Agents lack questioning leads**: When planning a milestone or phase, agents don't know what to ask about because they have no record of which features are under-specified. The SRS makes this explicit — a top-level-only entry is a signal to ask the user.

---

## Design Principles

The SRS is not a traditional front-loaded specification. It is designed around progressive elaboration — the document starts sparse and grows richer as the project advances through milestones and phases. At initial alignment, the agent distills features from the knowledge base without extrapolating or inventing requirements beyond what the KB contains. The user is not forced to provide sub-points or detailed explanations for every feature upfront; top-level entries with just a name are valid and expected. These under-specified entries serve as explicit leads for agents — during milestone planning the agent sees a top-level-only feature and knows to ask "what exactly does this feature do?", and during phase planning the questions shift to "how should this be built technically?". This two-tier questioning pattern (what during milestones, how during phases) ensures the right detail arrives at the right planning level.

A single SRS requirement may be large enough to span multiple phases or even an entire milestone, while several smaller requirements may fit together in a single phase. The milestone planning step maps this relationship — it reads the SRS features assigned to that milestone by the PRD, elaborates them through user Q&A, updates the SRS with the new detail, and then distributes them across phases. This means milestone planning now has a dual output: the milestone document itself and SRS elaboration. The same pattern applies at the phase level for technical detail and field-level data schema.

The SRS replaces the knowledge base as the persistent reference after alignment. Where the KB is a snapshot of pre-Blueprint documents consulted once, the SRS carries the original feature intent forward into every future milestone and phase. An agent planning Milestone 3 can read the SRS to understand what was originally envisioned for a feature, even if the knowledge base has long since become irrelevant to day-to-day work.

---

## Impact Analysis

### Affected Milestones

- **M1 — Project Bootstrap**: The scaffold engine, templates, and Doctor/test infrastructure all live in M1 deliverables. Template additions and test changes affect M1 Phases 2, 3, and 4.

### Affected Phases

| Phase | Impact |
|-------|--------|
| M1 Phase 2 (Scaffold Engine) | Templates updated — new `srs.md` shell, new `srs-planning.md` core module, modified core templates |
| M1 Phase 3 (Template Integrity) | Doctor's canonical core file list gains `srs-planning.md` |
| M1 Phase 4 (Testing & Release) | Core template test count changes from 18 to 19 |

### Affected Files and Modules

**New files:**

| File | Purpose |
|------|---------|
| `templates/srs.md` | SRS editable shell template (with `{{project-name}}` interpolation) |
| `templates/docs/core/srs-planning.md` | SRS planning module — creation, structure, update rules |

**Template modifications (and corresponding live docs/core/ mirrors):**

| File | Change |
|------|--------|
| `templates/docs/core/alignment.md` | Major rework — new document production sequence (PRD body → SRS → milestone plan) |
| `templates/docs/core/prd-planning.md` | Two-stage PRD creation, SRS ID references in milestone features |
| `templates/docs/core/milestone-planning.md` | SRS as precondition, feature elaboration Q&A, SRS update, entity-level data schema |
| `templates/docs/core/phase-planning.md` | SRS as precondition, technical elaboration, SRS update, field-level data schema |
| `templates/docs/core/scope-change.md` | SRS entry creation for additive features |
| `templates/docs/core/planning.md` | SRS added to granularity progression, SRS added to module dispatch table |
| `templates/docs/core/blueprint-structure.md` | `srs.md` added to docs/ root (4 required files), layout, rules, validation |
| `templates/docs/core/health-check.md` | `srs.md` added to structural checks |
| `templates/CLAUDE.md` | SRS routing row in ModuleRouting table |
| `templates/AGENTS.md` | Same routing update |
| `templates/GEMINI.md` | Same routing update |
| `templates/QWEN.md` | Same routing update |

**Source code:**

| File | Change |
|------|--------|
| `src/init/archive-engine.ts` | `srs.md` added to `shellFiles` array in `copyEditableShells()` |

### Affected Existing Tests

| Test File | Impact |
|-----------|--------|
| `tests/stream-a/core-templates.test.ts` | `CANONICAL_CORE_FILES` list gains `srs-planning.md`, count changes from 18 to 19 |

### Dependency Notes

- No active planned work depends on the current three-file docs/ root constraint or the current alignment document production order.
- All changes are additive to the template content — existing scaffolded projects are not broken (they simply lack the SRS until the templates are updated and Doctor can repair).
- The scaffold engine change (`archive-engine.ts`) is a one-line addition to the `shellFiles` array.

---

## Revision Phases

### Phase 1 — SRS Module & Structural Registration

> Create the SRS planning module and template, register the SRS across the framework's structural, routing, and testing infrastructure.

- Create `srs-planning.md` core module defining SRS principles, structure, creation, elaboration, and update rules
- Create `srs.md` editable shell template with MoSCoW sections and data schema placeholder
- Update `blueprint-structure.md` — docs/ root now has 4 required files, add `srs.md` to layout, rules, validation
- Update `health-check.md` — add `srs.md` to structural checks
- Update `planning.md` — add SRS to granularity progression and module dispatch
- Update all agent entry points (CLAUDE.md, AGENTS.md, GEMINI.md, QWEN.md) — add SRS routing row
- Update `archive-engine.ts` — add `srs.md` to editable shells
- Update `core-templates.test.ts` — add `srs-planning.md` to canonical list (18 → 19)
- Mirror all template changes to live `docs/core/` files

### Phase 2 — Alignment & PRD Flow Rework

> Rework the first-time alignment flow so the SRS is created after the PRD body and used to generate the milestone plan. Update PRD planning for two-stage creation and SRS traceability.

- Rework `alignment.md` document production sequence: conventions → PRD body (no milestones) → SRS (load srs-planning.md) → milestone plan (load prd-planning.md) → first milestone doc → project-progress
- Update `alignment.md` analysis step to explicitly extract feature names and descriptions for SRS population
- Update `prd-planning.md` to support two-stage creation (body first, milestones after SRS)
- Update PRD template and example to show SRS ID references in milestone features
- Mirror all template changes to live `docs/core/` files

### Phase 3 — Planning Module Integration

> Wire SRS reading and updating into milestone planning, phase planning, and scope changes so the SRS is progressively elaborated throughout the project lifecycle.

- Update `milestone-planning.md` — add SRS as precondition, read SRS features for milestone, elaborate under-specified features via Q&A, update SRS with new detail, plan entity-level data schema
- Update `phase-planning.md` — add SRS as precondition, read SRS features for phase, guide technical Q&A from SRS, update SRS with architecture and field-level data schema
- Update `scope-change.md` — create new SRS entries when placing additive features, consider MoSCoW priority for milestone placement
- Mirror all template changes to live `docs/core/` files

---

## Phase Dependencies

```text
Phase 1 → Phase 2 → Phase 3
```

Phase 2 depends on Phase 1 because alignment.md must reference `srs-planning.md` which is created in Phase 1. Phase 3 depends on Phase 2 because the milestone/phase planning changes assume the PRD now contains SRS references (established in Phase 2's PRD changes).

---

## Success Criteria

- [ ] `docs/core/srs-planning.md` exists and defines the full SRS creation, structure, elaboration, and update workflow
- [ ] `templates/srs.md` exists as an editable shell with `{{project-name}}` interpolation and MoSCoW structure
- [ ] `blueprint-structure.md` lists 4 required docs/ root files including `srs.md`
- [ ] `health-check.md` structural checks include `srs.md`
- [ ] All 4 agent entry points route SRS intent to `srs-planning.md`
- [ ] `planning.md` granularity progression includes SRS between PRD and Milestone
- [ ] `alignment.md` document production creates SRS after PRD body and before milestone plan
- [ ] `prd-planning.md` supports two-stage PRD and SRS ID references in milestones
- [ ] `milestone-planning.md` reads SRS, elaborates features, and updates SRS with new detail
- [ ] `phase-planning.md` reads SRS, elaborates technical detail, and updates SRS with data schema
- [ ] `scope-change.md` creates SRS entries for additive features
- [ ] `archive-engine.ts` scaffolds `srs.md` as an editable shell
- [ ] `core-templates.test.ts` passes with 19 canonical core files
- [ ] All existing tests remain green
- [ ] No regressions in scaffold, doctor, or template integrity

---

## Explicitly Not Changing

| File | Reason |
|------|--------|
| `review.md` | DoD from phase planning already covers SRS verification |
| `execution.md` | No SRS-specific execution changes needed |
| `test-planning.md` | No direct SRS interaction |
| `phase-completion.md` | No direct SRS interaction |
| `revision-planning.md` | SRS modifications during revisions need deeper design — deferred |
| `tweak-planning.md` | No SRS interaction |
| `bug-resolution.md` | No SRS interaction |
| `git-execution-workflow.md` | No SRS interaction |
| `git-review-workflow.md` | No SRS interaction |
| `hierarchy.md` | No SRS interaction |

---

## Deferred Items

1. **SRS modifications during revisions**: When existing SRS features need to change (not add), `revision-planning.md` should include SRS impact analysis. This requires its own design pass and is deferred to a future revision.
2. **PRD template cleanup**: The current `templates/prd.md` has sections (Functional Requirements, Non-Functional Requirements, Technical Constraints, Open Questions) that contradict `prd-planning.md`'s non-technical philosophy and overlap with the SRS. The template is overwritten during alignment, so this is cosmetic — deferred.

---
