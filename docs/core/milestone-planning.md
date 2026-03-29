# Milestone Planning

This module defines how to plan and structure a milestone document.
A milestone represents a major product goal or version. It groups
related phases that together deliver a meaningful product increment.

---

<MilestonePrinciples>
  A milestone describes WHAT a product increment delivers and in
  what order, broken down into phases.

  A milestone document does NOT contain:
    - Task-level breakdowns (those belong in phase docs)
    - Schema definitions, API routes, or implementation detail
    - Subtasks or acceptance criteria per phase
    - An "Out of Scope" section
    - Open questions (those belong in project-progress.md)

  Each phase is described in one sentence — what it delivers, not
  how it is built. Phase docs handle the technical detail when
  that phase is actively being planned.

  A milestone is to its phases what the PRD is to its milestones:
  one level of zoom, no more.
</MilestonePrinciples>

---

<MilestoneProcess>
  PRECONDITIONS:
  - docs/prd.md is loaded (milestones are derived from the PRD)
  - docs/srs.md is loaded (milestone requirement slices are traced
    through the SRS)

  MILESTONE-PLANNING BASELINE:
    Milestone planning owns requirement-meaning elaboration for the
    milestone slice selected by the PRD.

    WHEN a requirement is concise or under-specified:
      - Ask what the requirement actually means at milestone level
      - Broaden the readable requirement text once clarified
      - Record the change in docs/srs.md during the same planning cycle

    WHEN a requirement is too broad to assign cleanly to phases:
      - Split it into atomic sub-requirements
      - Assign new IDs to the new atomic requirements
      - Record the split in docs/srs.md before finalizing phase grouping

    PHASE-ASSIGNMENT RULE:
      - When a milestone contains multiple in-scope requirements,
        assign each requirement to a specific phase
      - When a milestone begins with only one in-scope requirement
        but the work spans multiple phases, broaden or split that
        requirement into phase-ownable slices before assigning them
        across phases

    REFERENCE RULE:
      - Keep this local baseline aligned with docs/core/srs-planning.md
      - Still read docs/core/srs-planning.md for the canonical schema
        and requirement-spec guidance

  DURING QUESTIONS:
    - Understand what this milestone delivers as a whole
    - Clarify which PRD milestone this maps to
    - Refer to docs/core/srs-planning.md for the milestone-level
      requirement-elaboration baseline before probing the SRS slice
    - Read the milestone's referenced SRS requirement slice before
      asking new milestone-planning questions
    - Identify the major feature areas that need to be built
    - Use concise, under-specified, or overly broad SRS requirements
      as explicit prompts for clarification
    - If the user already knows the intended requirement shape,
      let them describe it directly first
    - If the user is not yet clear, do not ask what they want to
      elaborate; instead probe with short acceptance scenarios and
      concrete idea prompts so the user can react, accept, reject,
      or adjust the proposed behavior
    - After the user gives a clear preferred behavior, ask whether
      they want to hear a few more ideas before finalizing the
      milestone-level requirement wording
    - Ask how the user sees these grouping into phases
    - Ask about dependencies — which phases must complete before
      others can start
    - Do not drill into task-level detail — that is phase planning

  DURING DRAFTING:
    - Once a concise SRS requirement is understood, broaden the
      readable requirement text in docs/srs.md during the same
      planning cycle
    - If a broad SRS requirement cannot be assigned cleanly across
      the milestone's planned phases, split it into atomic
      sub-requirements before finalizing phase grouping
    - Assign each in-scope SRS requirement to a specific planned
      phase
    - If the milestone starts with only one in-scope SRS requirement
      but the work spans multiple phases, broaden or split that
      requirement into phase-ownable slices before assigning them
      across phases
    - Update the shared SRS Data Schema at the entity/domain level
      when milestone planning clarifies product structure, while
      keeping the milestone document itself at milestone granularity
    - Each phase gets a name and a one-sentence objective
    - Phase names describe capabilities, not implementations
      (e.g., "Auth & Accounts" not "Add auth data models and migrations")
    - Show the dependency order between phases
    - Define milestone-level success criteria — how do you know
      the milestone is complete
    - Keep phase count reasonable — typically 3–7 phases per milestone

  WHEN UPDATING AN EXISTING MILESTONE:
    - New phases may be added if scope expands — confirm with user first
    - Phase order may be adjusted if dependencies change
    - Do not remove phases without user confirmation
    - Update success criteria if the milestone's scope has changed
</MilestoneProcess>

---

<MilestoneTemplate>

  # Milestone {{N}} — {{Milestone Name}}

  > {{One paragraph describing what this milestone delivers at the product
  level. What can users do after this milestone that they couldn't before?}}

  ---

  ## Phases

  ### Phase 1 — {{Phase Name}}
  > {{One sentence — what this phase delivers and why it matters}}

  ### Phase 2 — {{Phase Name}}
  > {{One sentence — what this phase delivers and why it matters}}

  ### Phase 3 — {{Phase Name}}
  > {{One sentence — what this phase delivers and why it matters}}

  ---

  ## Phase Dependencies

  {{Describe the execution order. Which phases are sequential,
  which can run in parallel, and what blocks what.}}

  ```
  Phase 1 → Phase 2 → Phase 3
  Phase 3 → Phase 4
  Phase 3 → Phase 5 (parallel with Phase 4)
  Phase 6 depends on Phase 4 + Phase 5
  ```

  ---

  ## Success Criteria

  - [ ] {{Milestone-level condition — observable, not implementation-specific}}
  - [ ] {{Milestone-level condition}}
  - [ ] {{Milestone-level condition}}

  ---

</MilestoneTemplate>

---

<MilestoneExample>
  The following is an example of a well-structured milestone document.

  # Milestone 2 — Collaborative Editing

  > Users can collaboratively edit documents in real time. This milestone
  transforms the product from a single-user writing tool into a shared
  workspace where multiple people can work on the same document simultaneously.

  ---

  ## Phases

  ### Phase 1 — Data Foundation
  > Establish the data layer and sync infrastructure required by all
  collaborative features in this milestone.

  ### Phase 2 — Real-Time Editing
  > Multiple users can edit the same document simultaneously with
  changes appearing live.

  ### Phase 3 — Presence & Awareness
  > Users can see who else is in a document and where their cursors are.

  ### Phase 4 — Permissions & Sharing
  > Document owners control who can view, comment, or edit their documents.

  ### Phase 5 — Comments & Suggestions
  > Users can leave comments on specific text and suggest edits for
  the owner to accept or reject.

  ### Phase 6 — Testing & Hardening
  > End-to-end validation of all collaborative features under realistic
  multi-user conditions.

  ---

  ## Phase Dependencies

  ```
  Phase 1 → Phase 2
  Phase 2 → Phase 3 (parallel with Phase 4)
  Phase 2 → Phase 4 (parallel with Phase 3)
  Phase 3 + Phase 4 → Phase 5
  Phase 5 → Phase 6
  ```

  ---

  ## Success Criteria

  - [ ] Two or more users can edit a document simultaneously without data loss
  - [ ] Document owners can share with specific users at different permission levels
  - [ ] Comments and suggestions flow works end-to-end
  - [ ] No regressions in single-user editing functionality
  - [ ] All collaborative features validated under concurrent usage

  ---

</MilestoneExample>
