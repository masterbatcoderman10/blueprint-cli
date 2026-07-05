---
name: foundation-planning
description: Define the full bootstrap-only Foundation Planning workflow after Alignment completes; routes Foundation Planning intent
---
# Foundation Planning

Foundation Planning is a complete workflow. It turns approved Alignment
setup plus the existing Blueprint scaffold files into the first planning
artifacts. It begins after Alignment completes and ends only after
`docs/project-progress.md` is populated so normal Blueprint routing can
resume.

---

<FoundationPlanningPreconditions>
  Foundation Planning is bootstrap-only. Only `alignment-complete` plus
  empty progress may proceed.

  Foundation Planning may run ONLY when all of the following are true:
    - supported root files report `alignment-complete`
    - `docs/project-progress.md` is still an empty progress shell
    - required setup blocks exist and are complete:
      - `<ProjectConventions>`
      - `<AgentOrchestration>`
    - `docs/.blueprint/tasks.db` exists and tracker is available

  STOP MATRIX:
    - If the tracker is missing or unavailable, STOP and instruct the user
      to run `blueprint init`.
    - If required setup blocks are missing or incomplete, STOP without
      repairing them.
    - If `alignment-required` is present, STOP and redirect to Alignment.
    - If progress is already populated, STOP and route to normal
      planning/revision workflows.
    - If progress is empty and no supported marker is present, STOP with
      repair guidance.

  MARKER RULE:
    Foundation Planning reads marker state only.
    Alignment owns marker mutation and setup repair.
    Foundation Planning does not rewrite supported root files.

  HARD RULE:
    If any precondition fails, do not draft or update PRD, SRS, or
    project-progress.
</FoundationPlanningPreconditions>

---

<FoundationPlanningContext>
  Foundation Planning begins from existing project files and approved setup
  blocks.

  REQUIRED CONTEXT SOURCES:
    - existing scaffold files:
      - `docs/prd.md`
      - `docs/srs.md`
      - `docs/project-progress.md`
    - approved setup blocks:
      - `<ProjectConventions>`
      - `<AgentOrchestration>`

  LOCKED REFERENCE LOADS:
    - Load `reference/planning.md` for one-document planning discipline.
    - Load `reference/plan-prd.md` for PRD-specific rules.
    - Load `reference/srs.md` for SRS-specific rules.

  DO NOT:
    - reopen setup interviewing when the approved setup blocks are already
      present
    - mutate markers
    - repair setup blocks
    - load `reference/plan-test.md`
</FoundationPlanningContext>

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
    - keep milestone and phase document creation for later workflows
    - populated `docs/project-progress.md` unlocks normal Blueprint routing
</FoundationPlanningSequence>

---

<FoundationPlanningPRDStage1>
  PRD Stage 1 is the first artifact.

  PRD STAGE 1 WORKFLOW:
    - Load `reference/planning.md` and `reference/plan-prd.md`.
    - Interview only for product scope.
    - Draft the PRD Stage 1 body to `docs/prd.md`.
    - Write only the PRD body sections that Stage 1 allows.
    - Present the `docs/prd.md` path and a concise summary to the user.
    - Apply targeted edits to `docs/prd.md`.
    - Get explicit approval on PRD Stage 1 before SRS begins.

  HARD RULE:
    Do not load `reference/srs.md` or begin SRS drafting until the PRD
    Stage 1 draft is approved.
</FoundationPlanningPRDStage1>

---

<FoundationPlanningSRS>
  SRS is the second artifact.

  SRS WORKFLOW:
    - Load `reference/srs.md`.
    - Use the approved PRD Stage 1 artifact plus direct user Q&A as SRS inputs.
    - Derive stable requirement IDs under the `reference/srs.md` rules.
    - Preserve the SRS structure and metadata rules from `reference/srs.md`.
    - Draft the SRS to `docs/srs.md`.
    - Present the `docs/srs.md` path and a concise summary to the user.
    - Apply targeted edits to `docs/srs.md`.
    - Get explicit approval on the SRS before returning to PRD Stage 2.

  HARD RULE:
    Do not rerun Alignment while drafting the SRS.
</FoundationPlanningSRS>

---

<FoundationPlanningPRDStage2>
  PRD Stage 2 is the third artifact.

  PRD STAGE 2 WORKFLOW:
    - Reload `reference/plan-prd.md` for PRD Stage 2.
    - Return to `docs/prd.md`.
    - Project milestones from the approved SRS.
    - Reference SRS IDs from milestone descriptions.
    - Do not create milestone documents during PRD Stage 2.
    - Present the `docs/prd.md` path and a concise summary for PRD Stage 2.
    - Apply targeted milestone edits to `docs/prd.md`.
    - Get explicit approval on PRD Stage 2 before project-progress begins.
</FoundationPlanningPRDStage2>

---

<FoundationPlanningProjectProgress>
  `docs/project-progress.md` is the final artifact.

  PROJECT-PROGRESS WORKFLOW:
    - Populate the `docs/project-progress.md` shell last.
    - Set the first PRD milestone as the current pending milestone-planning target.
    - Keep the current phase at pending milestone planning.
    - Populated progress unlocks normal Blueprint routing.
    - Present the `docs/project-progress.md` path and a concise summary to the user.
    - Apply targeted edits to `docs/project-progress.md`.
    - Get explicit approval on `docs/project-progress.md` before Foundation Planning is complete.
    - Do not create phase docs while finalizing `docs/project-progress.md`.
    - Do not create test plans while finalizing `docs/project-progress.md`.
    - Do not create tracker tasks while finalizing `docs/project-progress.md`.
    - Do not mutate the board while finalizing `docs/project-progress.md`.
</FoundationPlanningProjectProgress>

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

  CONTEXT RULE:
    If context becomes crowded, stop and continue in a fresh session rather
    than batching more than one artifact.
</FoundationPlanningReviewGate>

---

<FoundationPlanningNonGoals>
  Foundation Planning does NOT:
    - no milestone docs
    - no phase docs
    - no test plans
    - no tracker tasks
    - no board mutations
    - no `docs/core/foundation-planning.md`
    - no `templates/docs/core/foundation-planning.md`
</FoundationPlanningNonGoals>

---

## Anti-Patterns

<AntiPatterns>
  <AntiPattern name="Batching Bootstrap Artifacts">
    <BadExample>Drafting PRD Stage 1, SRS, PRD Stage 2, and project-progress together, or moving to the next artifact before the current one has explicit approval.</BadExample>
    <Why>Foundation Planning is a gated workflow. Each artifact informs the next one. Batching hides mistakes and breaks the approval boundary between artifacts.</Why>
  </AntiPattern>
  <AntiPattern name="Crossing Into Later Planning">
    <BadExample>Creating milestone docs, phase docs, test plans, or tracker tasks during Foundation Planning because the information seems obvious.</BadExample>
    <Why>Foundation Planning ends at populated `docs/project-progress.md`. Milestones, phases, tests, tracker work, and board activity belong to later workflows.</Why>
  </AntiPattern>
  <AntiPattern name="Mutating Alignment State">
    <BadExample>Rewriting alignment markers, filling missing setup blocks, or otherwise trying to complete Alignment from inside Foundation Planning.</BadExample>
    <Why>Alignment owns setup completion, setup repair, and marker mutation. Foundation Planning treats setup as a precondition and must stop when setup is incomplete.</Why>
  </AntiPattern>
</AntiPatterns>
