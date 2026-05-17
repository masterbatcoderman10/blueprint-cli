# Revision 5 — Orchestration Protocol

**Status**: Planning
**Priority**: Immediate
**Trigger**: 2026-05-17 user request — once a phase plan is developed there is no protocol that turns an agent into an orchestrator capable of spawning parallel subagents per the parallelization map and running each stream's `execute → review → address → rereview` loop independently.

---

## What Is Changing

Blueprint gains a new core protocol module — `docs/core/orchestrate.md` — that defines the **orchestrator role** for an agent acting on a fully-planned phase. The existing `execution.md` flow stays as the per-task / per-stream protocol; `orchestrate.md` sits above it as a parallel-coordination layer.

This revision adds:

1. A new core module (`docs/core/orchestrate.md`) defining the orchestrator role, parallelization-map consumption rules, subagent dispatch semantics, and per-stream loop chaining
2. A routing entry in all 4 agent entry points (`templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`) so agents can discover the orchestration intent
3. A routing entry in the current project's `CLAUDE.md` so this project's own agent sessions can invoke it
4. Template propagation — `templates/docs/core/orchestrate.md` so future `blueprint init` runs scaffold the module into new projects
5. Doctor / template-integrity awareness of the new core file (additions to the canonical core file list)

## Why

- **No orchestration contract exists today.** `execution.md` documents how a single agent runs one gate/stream and explicitly forbids proceeding to the next gate or stream (`docs/core/execution.md:166` HARD RULE). `review.md` `<ReReview>` (lines 118–150) documents the sequential review loop per stream. Together they assume a single agent walks the phase one stream at a time.
- **Parallelization maps are produced but not consumed by any execution-time protocol.** `phase-planning.md` (lines 95, 269–284) produces a parallelization map in every phase document, but no module instructs agents on how to actually parallelize work according to it.
- **The execute → review → address → rereview loop blocks the slowest stream.** When three streams run in parallel and one finishes execution first, no protocol authorizes spawning its review loop independently. The orchestrator must hand-roll this every time.
- **Subagent-capable agents have no project-aligned protocol.** Agents with subagent-dispatch capability currently treat orchestration as a personal heuristic rather than a Blueprint contract, breaking consistency across sessions and agents.

---

## Design Principles

These principles are recorded here so R5-P1 phase planning can honor them. They are not implementation detail — they define the shape of the protocol that R5-P1 will write.

- **Opt-in role.** Orchestrator mode is invoked via a dedicated routing intent ("Orchestrate phase / stream execution"). It does not auto-replace `execution.md`. Direct execution remains the default when no orchestration is requested.
- **Map-faithful dispatch.** The orchestrator must adhere to the phase's parallelization map. Streams run only when their dependency arrows are satisfied. The gate runs first; streams without dependencies dispatch in parallel as soon as the gate completes; dependent streams wait for their named predecessors to reach the required state.
- **Independent per-stream loops.** Each stream owns its own `execute → review → address → rereview` cycle. When stream A finishes execution while streams B and C are still executing, the orchestrator MUST spawn stream A's review agent immediately — not wait for B or C.
- **Two scopes: stream-level and phase-level.** The orchestrator may be invoked for a single stream (one parallel loop) or for an entire phase (gate + all streams). Auto-loop dispatch emphasis applies primarily to phase-level orchestration.
- **No duplication of execution.md.** `orchestrate.md` MUST NOT re-define task creation, kanban state transitions, per-task steps a–g, or the in-task PARALLEL EXECUTION subsection. It references `execution.md`, `review.md`, and `git-execution-workflow.md` for those concerns.
- **Phase completion as final orchestration sub-step.** When orchestrating a full phase, the orchestrator runs phase completion (`phase-completion.md`) as its final sub-step after all streams are closed out. This unifies the full phase lifecycle under a single orchestration invocation. Stream-level orchestration does not trigger phase completion.

---

## Impact Analysis

This revision is **additive**. No existing behavior changes. All impact below is integration surface for the new module.

### Affected Milestones

- **M1 — Project Bootstrap**: Scaffold engine, template manifest, and Doctor / template-integrity tests live in M1 deliverables. Adding a new canonical core file touches the M1 template surface (Phases 2, 3, 4 deliverables).

### Affected Phases

| Phase | Impact |
|-------|--------|
| M1 Phase 2 (Scaffold Engine) | Templates updated — new `templates/docs/core/orchestrate.md` shipped by scaffold |
| M1 Phase 3 (Template Integrity) | Doctor's canonical core file list gains `orchestrate.md` |
| M1 Phase 4 (Testing & Release) | Core template test count increases by one |

### Affected Files and Modules

**New files:**

| File | Purpose |
|------|---------|
| `docs/core/orchestrate.md` | The orchestration protocol module (live copy in this project) |
| `templates/docs/core/orchestrate.md` | Scaffold-shipped copy for new Blueprint projects |
| `docs/milestones/revision-5-orchestration/phase-1-orchestration-module.md` | Phase 1 plan (produced by R5-P1 phase planning later) |

**Files updated (additive integration only):**

| File | Change |
|------|--------|
| `CLAUDE.md` (project root) | New `<ModuleRouting>` row routing orchestration intent to `docs/core/orchestrate.md` |
| `templates/CLAUDE.md` | Same new routing row |
| `templates/AGENTS.md` | Same new routing row |
| `templates/GEMINI.md` | Same new routing row |
| `templates/QWEN.md` | Same new routing row |
| `templates/docs/core/` (manifest if present) | Add `orchestrate.md` to canonical core file list |
| `tests/stream-a/core-templates.test.ts` (if present and applicable) | Increment canonical core file count by one |

### Affected Existing Tests

| Test File | Impact |
|-----------|--------|
| `tests/stream-a/core-templates.test.ts` | If a canonical-core-file count assertion exists, it increments by one. No assertion of orchestrate.md absence exists, so this is the only update. Forward-only per `conventions.md` testing policy — no behavior tests need rewriting. |

### Dependency Notes

- No active or pending work depends on the current canonical core file list staying unchanged.
- No active or pending work depends on the absence of an orchestration routing entry.
- This revision does not change `execution.md`, `review.md`, `phase-planning.md`, or any module that R4 just modified. It sits alongside them.

---

## SRS Implications

Classification per `revision-planning.md` `<RevisionSRSImpact>` → **EXTENDED SCOPE — new sub-requirement**. Orchestration is a distinct atomic capability not covered by any existing requirement (MAS-200, MAS-201, MAS-202 cover git workflow, hierarchical structuring, and progressive clarification respectively). The orchestrator role is a new capability — it is not a refinement of any existing requirement.

| Requirement ID | Action | Detail |
|----------------|--------|--------|
| MAS-203 (new) | Create | Title: "Agent Orchestration Protocol Module". Priority: Must. Status: `approved-pending-implementation`. Assigned milestone: Revision 5. Source: Revision 5 Orchestration. Introduced by: Revision 5. Supersedes / Superseded by: None. |
| MAS-200, MAS-201, MAS-202 | No change | None of these requirements change meaning, assignment, or status. |

The SRS update is part of this revision's scope — created alongside this revision document, not deferred to R5-P1 (`<RevisionRules>` says "SRS updates are executed as part of the revision's phases, not deferred", but identification + ID assignment is part of revision scoping per `RevisionSRSImpact` → status `approved-pending-implementation` until R5-P1 ships the module).

---

## Phases

This revision requires a single phase. Phase-level breakdown (gate/stream/task) is intentionally omitted here per `revision-planning.md` anti-pattern "Phase-Level Task Breakdown in Revision Plan" — it belongs in the phase document produced by `phase-planning.md` when R5-P1 is planned.

| Phase | Name | Scope Summary |
|-------|------|---------------|
| 1 | Orchestration Module & Routing Integration | Author `orchestrate.md`, propagate to templates, add routing rows to all 4 agent entry points + project CLAUDE.md, register in Doctor / template-integrity surface, update SRS status from `approved-pending-implementation` to `active`. |

---

## Success Criteria

- [ ] `docs/core/orchestrate.md` exists and defines the full orchestrator role: invocation, parallelization-map consumption, subagent dispatch, per-stream loop chaining, stream-level vs phase-level scoping, and references (not duplicates) to `execution.md` / `review.md`
- [ ] `templates/docs/core/orchestrate.md` exists with identical content
- [ ] All 4 templated agent entry points (`templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`) include the orchestration routing row
- [ ] Project-root `CLAUDE.md` includes the orchestration routing row
- [ ] Template-integrity / Doctor surface recognizes `orchestrate.md` as a required core file in scaffolded projects
- [ ] SRS requirement MAS-203 status moves from `approved-pending-implementation` to `active` upon R5-P1 completion
- [ ] Full existing test suite remains green (472 tests, 75 files baseline as of 2026-05-17)
- [ ] No regression in `blueprint init`, `blueprint doctor`, or template integrity flows

---

## Explicitly Not Changing

| File | Reason |
|------|--------|
| `execution.md` | Orchestrator references execution.md; does not modify it |
| `review.md` | Orchestrator references review.md's `<ReviewProcess>` and `<ReReview>`; does not modify them |
| `phase-planning.md` | Parallelization map format is consumed as-is; format unchanged |
| `git-execution-workflow.md` | Per-stream commit / branch flow unchanged |
| `git-review-workflow.md` | Per-stream review flow unchanged |
| `phase-completion.md` | Invoked automatically by phase-level orchestration as its final sub-step; trigger section updated accordingly |
| `tweak-planning.md` | No interaction |
| `bug-resolution.md` | No interaction |
| `scope-change.md` | No interaction |
| `revision-planning.md` | No interaction (this revision uses it but does not change it) |
| `srs-planning.md` | No interaction beyond adding MAS-203 per existing rules |
| `hierarchy.md` | No interaction |

---

## Deferred Items

1. **Stream-level auto-loop emphasis.** The protocol prioritizes phase-level orchestration auto-loops. Whether stream-level orchestration should also auto-spawn its own review loop (versus deferring to the invoking session) is left for R5-P1 to specify based on user clarification during phase planning.
2. **Cross-orchestrator coordination.** If multiple orchestrators run in parallel against different phases of different projects, no cross-coordination protocol is defined here. Out of scope.
3. **Subagent failure recovery / retry semantics.** Detailed failure-mode handling (timeouts, partial completion, subagent crashes) is for R5-P1 to design; this revision document only commits to the existence of the protocol, not its failure-recovery shape.
