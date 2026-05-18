# Scope Change

This module handles new features or capabilities that surface during
an active session. When a user mentions something that is not part of
the current plan, this module classifies it and either places it
(additive) or routes to revision planning (modifying).

---

<ScopeChangeFlow>
  PURPOSE: Classify a new feature or change and route it appropriately.

  Triggered when the user mentions a feature, idea, capability, or
  change that is not part of the current plan.

  STEP 1 — UNDERSTAND THE FEATURE
    Before evaluating, understand what the user is describing.
    Ask clarifying questions if the feature is vague or ambiguous.
    Do not classify until the feature is clearly understood.

  STEP 2 — CLASSIFY THE CHANGE

    ADDITIVE — The primary purpose is a new capability.
      The bulk of the work is new code. It may touch existing code
      at integration points (adding a route, updating navigation,
      importing in an index file), but the point of the change is
      to add something that does not exist yet.
      → GOTO <AdditivePlacement>

    MODIFYING — The primary purpose is changing existing behavior.
      Something that already works needs to work differently. The
      bulk of the work is in existing files. No new capability is
      being introduced — existing features, interactions, data
      models, or behavior are being altered.
      → Load docs/core/revision-planning.md. Follow its process.

    IF unclear, ask the user: "Is the main goal here to add
    something new, or to change how something existing works?"

    NOTE: Almost every additive change touches some existing code
    at integration points. That does not make it a revision. The
    distinction is where the bulk of the work lives and what the
    primary intent is.
</ScopeChangeFlow>

---

<AdditivePlacement>
  PURPOSE: Place a new feature at the correct level. Evaluate from
  the lowest level upward. Stop at the first level where it fits.

  LEVEL A — TASK IN CURRENT PHASE
    Can this feature be expressed as a task within an existing
    stream or gate of the current phase?

    Criteria:
      - It is small enough to be a single task (≤ 2 duration units)
      - It relates directly to the current phase's goals
      - It does not change the phase's scope or purpose

    IF yes:
      → Suggest to user: "This looks like it fits as a task in
        [stream/gate] of the current phase."
      → IF user confirms:
        - Update the phase document with the new task
        - Create the kanban task per execution.md
      → GOTO <SRSPlacement>

  LEVEL B — NEW PHASE IN CURRENT MILESTONE
    Is this feature too large for a task but belongs to the
    current milestone's scope?

    Criteria:
      - It requires its own gate/stream structure
      - It delivers a capability that fits the current milestone's
        product goal
      - It does not represent a new product direction

    IF yes:
      → Suggest to user: "This looks like a new phase in the
        current milestone."
      → IF user confirms:
        - Update the milestone document with the new phase
        - Phase planning happens separately when it is time
          to execute it
      → GOTO <SRSPlacement>

  LEVEL C — FEATURE UNDER EXISTING MILESTONE IN PRD
    Does this feature belong to a milestone that already exists
    in the PRD — either a past milestone, a future milestone,
    or the current one at a scope that exceeds a single phase?

    Criteria:
      - An existing milestone in the PRD covers this feature area
      - The feature is a natural addition to that milestone's scope
      - It does not represent a new product direction

    IF yes:
      → Suggest to user: "This looks like it belongs under
        [milestone name] in the PRD."
      → IF user confirms:
        - Load docs/core/prd-planning.md
        - Add the feature as a bullet under the appropriate milestone
        - Do NOT modify any existing milestone documents — the
          feature lives in the PRD until that milestone is
          (re)planned
      → GOTO <SRSPlacement>

  LEVEL D — NEW MILESTONE IN PRD
    The feature does not fit under any existing milestone.
    It represents a new product capability or direction.

    IF reached:
      → Suggest to user: "This looks like a new product capability
        that needs its own milestone in the PRD."
      → IF user confirms:
        - Load docs/core/prd-planning.md
        - Add a new milestone with the feature
        - Confirm milestone name and placement with user
      → GOTO <SRSPlacement>
</AdditivePlacement>

---

<SRSPlacement>
  PURPOSE: Update the SRS as part of any confirmed additive placement.
  This step runs after the feature has been placed at a level (A–D)
  and before the change is recorded in project-progress.md.

  STEP 1 — UPDATE THE SRS
    Load docs/core/srs-planning.md. Follow its rules for additive
    requirement insertion (SRSModificationRules) to create or update
    the corresponding SRS requirement entry.
    Use "Scope Change" as the introduction path.

  STEP 2 — CONFIRM PLACEMENT CONSISTENCY
    Verify that the SRS requirement's milestone assignment matches the
    placement level:
      - Level A or B → current milestone
      - Level C → the existing milestone selected during placement
      - Level D → the new milestone created during placement

    IF the milestone assignment does not match, correct it before
    proceeding.

  → GOTO <RecordChange>
</SRSPlacement>

---

<RecordChange>
  After additive placement is confirmed and the SRS is updated per
  <SRSPlacement>:
  - Add an entry to the Decisions section of project-progress.md
    noting what was added, where it was placed, and which SRS
    requirement ID was created or updated.
  - This ensures the change is visible at session start.
</RecordChange>

---

<PlanningDiscoveredRequirements>
  PURPOSE: Handle additive sub-requirements discovered during
  milestone or phase planning.

  This section applies when a planning agent — not the user — uncovers
  an additive capability that is missing from the SRS. This typically
  happens when a broad requirement is being broken down and one of the
  resulting pieces turns out to be a genuinely new capability rather
  than a refinement of the original.

  TRIGGER:
    During milestone planning or phase planning, the planner identifies
    a capability that:
      - Is not already captured in the SRS
      - Is additive (a new capability, not a change to existing behavior)
      - Was hidden inside a broader requirement or surfaced through
        clarification questions

  FLOW:

  STEP 1 — PAUSE DOWNSTREAM PLANNING
    The planner must not continue assigning phases, streams, or tasks
    for the discovered capability until the SRS is updated.
    Downstream planning depends on a clean SRS slice. An unrecorded
    capability breaks traceability.

  STEP 2 — UPDATE THE SRS
    Load docs/core/srs-planning.md. Follow its rules for additive
    requirement insertion (SRSModificationRules) to create the new
    SRS requirement entry.
    Use "Milestone Planning" or "Phase Planning" as the introduction
    path, whichever discovered the capability.

    IF the discovered capability was split from an existing broad
    requirement, also update the parent requirement's change log to
    note the split per srs-planning.md audit trace rules.

  STEP 3 — RESUME PLANNING
    Once the SRS contains the new requirement, downstream planning
    may continue. The planner should assign the new requirement to
    the appropriate phase or stream as part of the normal planning
    flow.

  RULES:
  - The SRS update must happen before phase or stream assignment.
    Never assign an unrecorded capability to a stream.
  - Planning-discovered requirements follow the same SRS identity
    rules as any other requirement: one ID per atomic capability.
  - If the discovery changes the meaning of an existing requirement
    rather than adding a new one, this is not an additive discovery.
    Route through revision handling instead.
</PlanningDiscoveredRequirements>

---

<AdditiveVsModifyingBoundary>
  PURPOSE: Define when an SRS change is additive elaboration versus
  a material meaning change that requires revision planning.

  This boundary applies whenever an agent is about to update the SRS
  through scope-change handling — whether triggered by a user request,
  by <SRSPlacement>, or by <PlanningDiscoveredRequirements>.

  ADDITIVE SRS GROWTH — stays within scope-change handling:
    - A genuinely new capability that did not exist in the SRS
    - More detail added to an existing requirement without changing
      what the requirement means
    - A broad requirement split into atomic sub-requirements where
      the original intent is preserved across the resulting pieces
    - Reassignment of a requirement to a different milestone or phase
    - Schema, data-structure, or architecture notes that deepen an
      existing requirement without altering its user-facing outcome

    In all additive cases, the SRS update uses the same requirement
    ID (for elaboration) or creates a new ID (for a new capability).
    No revision planning is needed.

  MODIFYING CHANGE — must route to revision planning:
    - The intended user-facing behavior of an existing requirement
      changes materially
    - The user outcome described by a requirement is replaced, not
      refined
    - A "split" would produce pieces whose combined meaning differs
      from the original requirement
    - A scope-change request is framed as additive but actually
      requires an existing requirement to work differently

    In all modifying cases, do not update the SRS directly. Load
    docs/core/revision-planning.md and follow its process. Revision
    planning owns impact analysis and supersession handling.

  DECISION TEST:
    Ask: "After this change, does the existing requirement still
    describe the same user outcome it described before?"

    IF yes → additive. Proceed with scope-change SRS update.
    IF no  → modifying. Route to revision planning.
    IF unclear → ask the user before editing the SRS.
</AdditiveVsModifyingBoundary>

---

<ScopeChangeRules>
  RULES:
  - Always suggest placement — never decide unilaterally.
  - For additive changes, evaluate from lowest level upward.
    Do not skip levels.
  - For modifying changes, always route to revision-planning.md.
    Do not try to squeeze a revision into an existing phase or task.
  - Never modify completed milestone documents. If a feature relates
    to a past milestone, add it to the PRD under that milestone.
  - Never add a feature to a future milestone's document if that
    document does not exist yet. Add it to the PRD instead.
  - One change per evaluation. If the user mentions multiple
    changes, evaluate each one separately.
  - If the agent is uncertain whether a change is additive or
    modifying, ask the user.
  - Additive placement always includes the corresponding SRS update.
    The SRS must not fall behind when new capabilities are placed.
  - An SRS update that changes requirement meaning is not additive
    elaboration. Apply the <AdditiveVsModifyingBoundary> decision
    test before writing to the SRS.
</ScopeChangeRules>
