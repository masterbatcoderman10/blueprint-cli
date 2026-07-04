---
name: foundation-planning
description: Lock bootstrap-only sequencing and boundaries for Foundation Planning after alignment completes; routes Foundation Planning intent
---
# Foundation Planning

This module defines the locked bootstrap contract for Foundation Planning.
Phase 1 only establishes when this workflow is allowed, what order it
follows, and what it must not do. The deeper interviewing and drafting
workflow remains Phase 3 work.

---

<FoundationPlanningPreconditions>
  Foundation Planning is bootstrap-only. It may run ONLY when all of the
  following are true:
    - supported root files report `alignment-complete`
    - `docs/project-progress.md` is still an empty progress shell
    - required setup blocks exist and are complete:
      - `<ProjectConventions>`
      - `<AgentOrchestration>`
    - `docs/.blueprint/tasks.db` exists and tracker is available

  IF any precondition fails:
    - STOP
    - do not draft or update PRD, SRS, or project-progress
    - redirect to init/repair, Alignment, or normal planning flows as appropriate

  MARKER RULE:
    Foundation Planning reads marker state only. Alignment owns marker
    mutation. Foundation Planning does not rewrite supported root files.
</FoundationPlanningPreconditions>

---

<FoundationPlanningSequence>
  Artifact order is locked:
    PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress

  REQUIRED ORDER:
    1. PRD Stage 1
    2. SRS
    3. PRD Stage 2
    4. project-progress

  RULES:
    - do not skip artifacts
    - do not reorder artifacts
    - do not batch artifacts together
    - load `reference/plan-prd.md` for PRD rules
    - load `reference/srs.md` for SRS rules
    - load `reference/planning.md` for one-document planning discipline
</FoundationPlanningSequence>

---

<FoundationPlanningReviewGate>
  Foundation Planning proceeds one artifact at a time.

  FOR EACH ARTIFACT:
    - draft to disk
    - present the path and a concise summary to the user
    - apply targeted edits
    - get explicit approval
    - only then move to the next artifact

  HARD RULE:
    Do not advance to the next artifact until the current artifact has
    explicit approval.
</FoundationPlanningReviewGate>

---

<FoundationPlanningNonGoals>
  Phase 1 boundaries are explicit:
    - no milestone docs
    - no phase docs
    - no test plans
    - no tracker tasks
    - no board mutations
    - no `docs/core/foundation-planning.md`
    - no `templates/docs/core/foundation-planning.md`

  The deeper interviewing and drafting workflow remains Phase 3 work.
</FoundationPlanningNonGoals>

---

## Anti-Patterns

<AntiPatterns>
  <AntiPattern name="Batching Bootstrap Artifacts">
    <BadExample>Drafting PRD Stage 1, SRS, PRD Stage 2, and project-progress together, or moving to the next artifact before the current one has explicit approval.</BadExample>
    <Why>Foundation Planning is a gated bootstrap workflow. Each artifact can change what comes next. Batching hides mistakes and breaks the locked review sequence.</Why>
  </AntiPattern>
  <AntiPattern name="Crossing Into Later Planning">
    <BadExample>Creating milestone docs, phase docs, test plans, or tracker tasks during Foundation Planning because the information seems obvious.</BadExample>
    <Why>Foundation Planning only establishes bootstrap planning artifacts. Milestones, phases, tests, and tracker work belong to later sessions and later modules.</Why>
  </AntiPattern>
  <AntiPattern name="Mutating Alignment State">
    <BadExample>Rewriting alignment markers, filling missing setup blocks, or otherwise trying to complete Alignment from inside Foundation Planning.</BadExample>
    <Why>Alignment owns setup completion and marker mutation. Foundation Planning treats setup as a precondition and must stop when setup is incomplete.</Why>
  </AntiPattern>
</AntiPatterns>
