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
        - Create the kanban task per task-management-protocol.md
      → GOTO <RecordChange>

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
      → GOTO <RecordChange>

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
      → GOTO <RecordChange>

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
      → GOTO <RecordChange>
</AdditivePlacement>

---

<RecordChange>
  After any additive placement is confirmed and applied:
  - Add an entry to the Decisions section of project-progress.md
    noting what was added and where it was placed.
  - This ensures the change is visible at session start.
</RecordChange>

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
</ScopeChangeRules>
