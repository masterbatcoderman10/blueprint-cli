# Revision 7 - Standalone Tweak Workflow

**Status**: Planning
**Priority**: Next
**Trigger**: 2026-05-19 user request - redefine tweaks from inline phase corrections into a top-level quick-change workflow for small, contained changes that should move faster than revisions while preserving Blueprint's planning, tracker, review, and verification guards.

---

## What Is Changing

Blueprint's tweak contract is promoted from an inline phase-section correction mechanism into a first-class, top-level planning unit.

Today, `docs/core/tweak-planning.md` defines a tweak as a correction to completed tasks within a single active phase, tracked inside that phase document's `## Tweaks` section. Revision 7 replaces that model with a standalone workflow:

1. `docs/tweaks/` becomes a required Blueprint directory scaffolded into every project.
2. Each tweak gets one standalone Markdown plan under `docs/tweaks/`.
3. A tweak document is lightweight and phase-plan-shaped: goals, dependencies, small task tables, acceptance criteria, verification notes, Definition of Done, and completion status.
4. Tweaks can cover small additions or modifications, but not new features, major edits, regressive work, or anything that needs formal test planning or multi-phase revision structure.
5. The normal execution, review, address-notes, rereview, tracker, and verification loops apply to tweak tasks.
6. Phase documents no longer own, contain, or route tweak entries. New phase and revision phase plans must not include a `## Tweaks` section.
7. Historical phase docs remain untouched as audit history, but their old `## Tweaks` sections no longer define the active tweak workflow.

This creates a "quick mode" for vibe-coding-sized changes: fast enough for UI polish, wording changes, a single anti-pattern addition, or another confined non-feature change, while still preserving Blueprint's checks and guards.

---

## Why

The current tweak model is too narrow. It only handles corrections to already completed tasks inside the current phase. That leaves a gap between:

- informal small changes, which are fast but lose traceability and review discipline
- full revisions, which are traceable but too heavy for a single contained UI, copy, documentation, or process polish change

Revision 7 fills that gap with a top-level small-change contract. Tweaks become the lightweight path for contained work that should still be planned, tracked, reviewed, and verified.

---

## Impact Analysis

This revision is **modifying**. It changes the meaning of an existing Blueprint contract introduced by Revision 2.

### Affected Product Milestones

| Milestone | Impact |
|-----------|--------|
| M1 - Project Bootstrap | Scaffolded structure, template docs, Doctor validation, and template integrity behavior change. |

### Affected Historical Revision

| Revision | Impact |
|----------|--------|
| Revision 2 - Tweak Contract | Superseded by R7's standalone tweak workflow. Historical R2 docs remain unchanged as audit history. |

### Affected M1 Phases

| Phase | Impact |
|-------|--------|
| M1 Phase 2 - Scaffold Engine | `blueprint init` must create `docs/tweaks/`; templates and generated project structure must include the new directory. |
| M1 Phase 3 - Template Integrity | Doctor canonical structure must validate and repair `docs/tweaks/`; tests must cover the required directory. |
| M1 Phase 4 - Testing Setup & Release Readiness | Regression coverage updates for scaffold, Doctor, routing, and template mirror behavior. |

### Affected Files and Modules

**Core protocol docs:**

| File | Change |
|------|--------|
| `docs/core/tweak-planning.md` | Rewrite from inline in-phase correction contract to standalone top-level quick-change workflow. |
| `docs/core/phase-planning.md` | Remove the phase-template `## Tweaks` section entirely; phase docs are no longer a tweak container. |
| `docs/core/blueprint-structure.md` | Add `docs/tweaks/` to canonical layout, rules, validation checklist, and "What Goes Where". |
| `docs/core/hierarchy.md` | Clarify that tweaks are a top-level quick-change contract outside the Project -> Milestone -> Phase hierarchy, with optional milestone impact notes. |
| `docs/core/scope-change.md` | Clarify that new features still route through scope-change / milestone placement; small non-feature additions can route to tweak planning. |
| `docs/core/revision-planning.md` | Clarify the boundary: new features, major edits, heavy work, regressive changes, cross-cutting changes, or multi-phase work remain revisions / milestone work; small contained non-feature work can be a tweak. |
| `docs/core/execution.md` | Allow tweak documents as execution sources alongside phase documents for gate / stream task creation and tracker operations. |
| `docs/core/review.md` | Allow review of tweak gates / streams using the same review loop as phase work. |
| `docs/core/phase-completion.md` | Avoid treating standalone tweak completion as phase completion; tweak completion is owned by `tweak-planning.md`. |
| `docs/core/test-planning.md` | Clarify that tweaks do not get their own formal test-planning workflow; needing a formal test plan is an escalation signal to revision / milestone planning. |
| `docs/core/orchestrate.md` | Clarify whether orchestration can run a tweak's gate / stream map when the tweak document has a parallelization map. |

**Templates and root routing:**

| File | Change |
|------|--------|
| `templates/docs/core/tweak-planning.md` | Mirror the rewritten live module. |
| `templates/docs/core/phase-planning.md` | Mirror the updated phase template with no `## Tweaks` section. |
| `templates/docs/core/blueprint-structure.md` and other touched core templates | Mirror live core-doc changes byte-for-byte. |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md` | Route tweak intent as top-level quick-change planning, not "correct completed tasks in current phase". |
| `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`, `templates/QWEN.md` | Mirror the routing update for scaffolded projects. |

**Code and structural validation:**

| File | Change |
|------|--------|
| `src/init/archive-engine.ts` and scaffold helpers | Create `docs/tweaks/` for every initialized Blueprint project and report it in created directories. |
| `src/doctor/structure.ts` | Add `docs/tweaks` to required Blueprint directories. |
| Doctor audit / repair flow | Detect and repair a missing `docs/tweaks/` directory in existing projects. |
| Template inventory / scaffold tests | Update expected directory tree and any canonical structure expectations. |

### Affected Tests

Existing tests that verify the old inline tweak contract will need forward-only updates:

| Test File | Expected Impact |
|-----------|-----------------|
| `tests/revision-2/gate-1.0/tweak-contract.test.ts` | Active expectations that require inline phase `## Tweaks` ownership must be superseded by R7 coverage for standalone tweak plans. Historical R2 docs remain unchanged, but active tests must follow the current contract. |
| `tests/phase-2/stream-c/archive-and-scaffold-engine.test.ts` | Scaffold directory tree should include `docs/tweaks/`. |
| `tests/phase-3/gate-3.0/canonical-structure.test.ts` | Required directory set should include `docs/tweaks/`. |
| `tests/stream-a/core-templates.test.ts` | Core template list remains stable unless R7 adds a new core module; content expectations may change. |
| `tests/stream-c/project-templates-mirror.test.ts` | Live/template byte-for-byte mirrors must be updated after core doc rewrites. |
| R6 planning-doc rewrite tests | Any expectations about old tweak wording should be updated to the standalone workflow. |

These tests verify the old behavior. Updating them is part of R7 scope, not a regression.

### Dependency Notes

- R6 is complete, so R7 can build on the built-in tracker rather than the old kanban MCP.
- R7 should execute before any future work creates new inline phase tweak sections.
- Existing historical milestone, revision, and phase documents are not rewritten. They remain audit history and may still contain old `## Tweaks` sections.

---

## SRS Implications

Classification per `revision-planning.md` `<RevisionSRSImpact>`: **EXTENDED SCOPE - new atomic requirement**.

No existing active SRS requirement owns tweak planning semantics. MAS-200 through MAS-205 cover git workflow, SRS structure, orchestration, and the built-in tracker. R7 introduces a distinct planning capability, so it gets its own requirement.

| Requirement ID | Action | Detail |
|----------------|--------|--------|
| MAS-206 (new) | Create | Title: **Standalone Tweak Workflow**. Priority: Must. Status: `approved-pending-implementation`. Assigned milestone: Revision 7. Source: Revision 7 Standalone Tweak Workflow. Introduced by: Revision 7. Supersedes / Superseded by: None. Captures top-level `docs/tweaks/`, standalone lightweight tweak plans, small-change boundary rules, no formal tweak test plan, tracker-backed execution/review, and completion flow. |
| MAS-200, MAS-201, MAS-202, MAS-203, MAS-204, MAS-205 | No change | None of these requirements change meaning, assignment, or status. |

MAS-206 moves to `active` when the R7 implementation phase completes.

---

## Phases

This revision requires **one phase**. Phase-level gate / stream / task breakdown is intentionally omitted here per `revision-planning.md` anti-pattern *"Phase-Level Task Breakdown in Revision Plan"*.

| Phase | Name | Scope Summary |
|-------|------|---------------|
| 1 | Standalone Tweak Workflow & Scaffold Integration | Rewrite the tweak contract, remove tweak sections from all future phase-plan templates, update routing and related core modules, add `docs/tweaks/` to scaffold and Doctor structure, mirror templates, update tests, create MAS-206 in the SRS, and verify the full suite. |

---

## Success Criteria

- [ ] `docs/core/tweak-planning.md` defines tweaks as top-level standalone quick-change plans under `docs/tweaks/`.
- [ ] Tweak documents use a lightweight phase-plan-shaped structure: goals, dependencies, small task tables, acceptance criteria, verification notes, Definition of Done, and completion state.
- [ ] Tweak documents do not include a formal Test Plan section; needing one escalates the work out of tweak mode.
- [ ] Tweak boundary rules are explicit:
  - Small, contained UI, copy, documentation, process, or similarly confined non-feature work may be a tweak.
  - Small additions or modifications may be a tweak if they are contained and do not create a new feature.
  - New features, major edits, regressive changes, cross-cutting contract changes, formal test-plan needs, or work needing multiple phases must route to revision / milestone planning.
  - Bug reports still route through `bug-resolution.md`.
- [ ] `docs/tweaks/` is scaffolded by `blueprint init` for every project.
- [ ] Doctor validates and repairs a missing `docs/tweaks/` directory.
- [ ] Root and template agent routing describe tweak intent as top-level quick-change planning.
- [ ] New phase and revision phase templates contain no `## Tweaks` section.
- [ ] `docs/core/phase-planning.md` explicitly treats standalone tweaks as outside phase documents, with routing to `docs/core/tweak-planning.md` instead of an inline section.
- [ ] Live core docs and template copies match where byte-for-byte mirroring is expected.
- [ ] Tracker tasks can be created from a tweak document's gate / stream task tables using the existing task state machine.
- [ ] Review, address-notes, rereview, and verification flows work for tweak tasks using the existing tracker-backed lifecycle.
- [ ] MAS-206 is created with status `approved-pending-implementation` during planning and moves to `active` when R7 completes.
- [ ] Full existing test suite remains green after forward-only test updates.
- [ ] No regression in `blueprint init`, `blueprint doctor`, `blueprint board`, scaffold, template integrity, execution, or review flows.

---

## Explicitly Not Changing

| File / Area | Reason |
|-------------|--------|
| Historical milestone, revision, and phase docs | They are audit history. Old `## Tweaks` sections remain only as historical records and are not the active tweak contract. |
| `docs/prd.md` | This is workflow machinery, not a new product milestone goal. |
| Built-in tracker schema | Existing task and review-comment tables are sufficient for tweak tasks. |
| R6 tracker board UI | R7 can use existing milestone/task fields; board-specific affordances for tweak filtering are deferred unless needed during phase planning. |
| Bug workflow | Bugs keep routing through `bug-resolution.md`; tweaks are planned changes, not defect triage. |
| Full revision workflow | Heavy or multi-phase work still belongs to `revision-planning.md`. |

---

## Sequencing & Triggers

- R7 is the next planned revision after R6.
- R7 should be phase-planned before execution using `docs/core/planning.md` -> `docs/core/phase-planning.md`.
- Once R7 completes, future small contained changes should prefer standalone tweak planning over full revision planning when they satisfy the tweak boundary rules.

---

## Deferred Items

1. **Tweak file naming convention.** Candidate: `docs/tweaks/tweak-<n>-<slug>.md`. Final ID and filename rules should be locked during R7 Phase 1 planning.
2. **Tracker milestone value for tweak tasks.** Candidate: use `Tweak <n> - <name>` in the tracker `milestone` field so board filtering works without schema changes.
3. **Whether to add board filtering for tweaks.** The current board can group by milestone and task metadata. Dedicated tweak filters are deferred unless Phase 1 finds they are necessary.
