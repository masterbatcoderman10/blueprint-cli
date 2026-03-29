# Revision Planning

This module handles changes to existing functionality. A revision is
required when something that already works needs to work differently.
Unlike additive changes, revisions carry risk — they modify tested
code and can introduce regressions across features built in earlier
milestones and phases.

Revision planning is a deep process. It requires top-down impact
analysis before any work begins, and produces its own document with
phases, just as a milestone does.

---

<RevisionProcess>
  PURPOSE: Analyze the impact of a proposed change to existing
  functionality and produce a revision document that can be
  planned and executed safely.

  PRECONDITIONS:
  - docs/prd.md is available
  - docs/srs.md is available
  - docs/conventions.md is loaded
  - Milestone and phase documents exist for the affected areas

  STEP 1 — UNDERSTAND THE CHANGE
    Clarify what is changing and why.
    - What existing behavior needs to be different?
    - What is the desired new behavior?
    - What triggered this change? (user feedback, new requirement,
      technical constraint, design improvement)

    Do not proceed to analysis until the change is clearly defined.

  STEP 2 — IMPACT ANALYSIS (top-down)
    Work downward through the hierarchy to localize the impact.

    a. PRD level — which milestones are affected?
       Review the PRD milestones. Identify every milestone whose
       features touch the area being changed. There may be one
       or several.

    b. Milestone level — which phases are affected?
       For each affected milestone, review its milestone document.
       Identify the specific phases that built the functionality
       being changed.

    c. Phase level — which files and modules are affected?
       For each affected phase, review its phase document.
       Identify the specific tasks, components, and files that
       will need modification.

    d. Test level — which existing tests are affected?
       For each affected phase, review its Test Plan section.
       Identify tests that verify the behavior being changed.
       These tests will need to be updated or replaced as part
       of the revision — they test the OLD behavior and will
       fail after the change. This is expected, not a regression.
       List affected test IDs in the analysis.

    e. SRS level — which requirement IDs are affected?
       Review docs/srs.md. Identify every requirement whose
       meaning, assignment, or status is touched by the proposed
       change. List each affected requirement ID, its current
       title, and its current status. A revision may affect one
       requirement or several across different milestones.

    Present the full analysis to the user:
      - Affected SRS requirement IDs and their current status
      - Affected milestones
      - Affected phases within each milestone
      - Affected files and modules within each phase
      - Affected tests that will need updating
      - Whether any active or upcoming work depends on the
        current behavior being changed

    Do not proceed without user confirmation that the scope
    of impact is understood.

  STEP 3 — CREATE REVISION DOCUMENT
    Revision documents live in their own subfolder under
    docs/milestones/:

    Folder: docs/milestones/revision-<n>-<name>/
    File:   docs/milestones/revision-<n>-<name>/revision-<n>-<name>.md

    The revision document follows the same structure as a milestone
    document — phases, dependencies, success criteria — but focused
    on what is changing rather than what is being added.

    The revision document must include:
      - What is changing and why
      - Impact analysis (which milestones, phases, files, and
        tests are affected)
      - SRS implications — for each affected requirement ID:
          - Whether the requirement keeps its ID (same meaning)
            or requires a new superseding ID (changed meaning)
          - What SRS updates are needed (text, metadata,
            reassignment, supersession links, change-log entries)
          - If supersession applies: the new requirement ID that
            will replace the prior one, with bidirectional links
      - Phases needed to execute the revision safely
      - Which existing tests must be updated or replaced to
        reflect the new behavior
      - Success criteria that confirm the revision is complete
        without regressions

    Phase documents for the revision live in the same subfolder,
    just as milestone phases live in their milestone's subfolder.
    Phase planning for a revision follows the same process as
    any other phase — load docs/core/phase-planning.md when it
    is time to plan a revision's phase.

  STEP 4 — UPDATE PROJECT STATE
    - Add the revision under Pending Revisions in
      project-progress.md
    - Add a decision entry noting the revision was identified
      and its scope of impact
</RevisionProcess>

---

<RevisionSRSImpact>
  PURPOSE: Define how revision planning handles SRS requirement
  identity based on whether the revision changes requirement meaning.

  Before applying any SRS updates, load docs/core/srs-planning.md.
  Its RequirementIdentity, PlanningBaseline, and SRSModificationRules
  sections define the ID decision rule, audit trace expectations, and
  supersession mechanics that govern all changes below.

  After STEP 2 identifies affected SRS requirement IDs, the agent
  must classify each affected requirement using those rules:

  SAME MEANING — SAME ID
    The revision clarifies, reassigns, or elaborates the requirement
    without changing what the requirement means to the user.

    Actions:
      - Keep the existing SRS requirement ID
      - Update the readable requirement text if wording improves
      - Update metadata fields if milestone assignment or status
        changed
      - Add a change-log entry recording the revision as the source
        of the update (e.g., "Updated via Revision N — <name>")

    Examples:
      - A revision restructures code without changing user-facing
        behavior — the requirement stays the same
      - A revision moves a capability from one phase to another
        within the same milestone — reassignment, not new meaning
      - A revision adds implementation detail that does not alter
        the user outcome

  MATERIALLY CHANGED MEANING — NEW SUPERSEDING ID
    The revision changes what the requirement means. The user
    outcome, the expected behavior, or the capability itself is
    different from what was originally specified.

    Actions:
      - Create a new SRS requirement ID for the approved target
        behavior
      - Set the new requirement status to
        approved-pending-implementation
      - Set the new requirement's "Introduced by" to Revision
      - Set the new requirement's "Supersedes" to the prior
        requirement ID
      - Mark the prior requirement status as superseded
      - Set the prior requirement's "Superseded by" to the new
        requirement ID
      - Add change-log entries in BOTH the prior and new
        requirement metadata
      - Preserve the prior requirement in the SRS for audit trace —
        do not delete it

    Examples:
      - A revision changes the authentication method from
        email-password to OAuth — the requirement means something
        different
      - A revision replaces a manual workflow with an automated one
        that changes user interaction — the user outcome differs
      - A revision narrows or expands a feature scope in ways that
        alter what the user can do

  EXTENDED SCOPE — SAME ID OR NEW SUB-REQUIREMENT
    The revision adds a new sub-capability to an existing requirement
    without replacing or removing existing behavior. The original
    requirement still holds, but the revision introduces something
    that was not there before.

    Evaluate against the atomicity rule:

    IF the new capability is a natural extension of the existing
    requirement (e.g., adding another login method to a requirement
    that already covers multiple login methods):
      - Keep the same SRS requirement ID
      - Elaborate the readable requirement text to include the new
        sub-capability
      - Add a change-log entry recording the revision as the source

    IF the new capability is distinct enough to stand as its own
    atomic requirement (e.g., email OTP authentication is a separate
    capability from third-party OAuth login):
      - Create a new SRS requirement ID for the new sub-capability
      - The original requirement keeps its ID unchanged — it is not
        superseded because its meaning has not changed
      - Set the new requirement's "Introduced by" to Revision
      - Link the new requirement to the same domain area in the
        Data Schema

    Examples:
      - A login requirement already elaborates third-party OAuth
        options; a revision requires email OTP sign-in — this is a
        new atomic capability, not a replacement of existing login
        methods
      - A recipe saving requirement covers manual entry; a revision
        requires URL import — if URL import is a distinct user
        outcome, it gets its own requirement ID
      - A notification requirement covers email alerts; a revision
        adds push notifications as an additional channel — evaluate
        whether channels are atomic or part of the same requirement

  MIXED IMPACT
    A single revision may affect multiple SRS requirements. Some may
    keep their IDs (same meaning), others may require supersession
    (changed meaning), and others may produce new sub-requirements
    (extended scope). Classify each requirement independently.

  WHEN UNCERTAIN
    If the agent cannot determine whether a revision changes meaning,
    merely elaborates, or extends scope, ask the user before editing
    the SRS. Do not default to any path silently.
</RevisionSRSImpact>

---

<RevisionPriority>
  The user decides when to execute a revision. It may be:
    - Immediate — interrupt current work if the revision affects
      code being actively built
    - Next — execute after the current phase or stream completes
    - Deferred — queue for later, after the current milestone

  The agent does not decide priority. But the agent DOES:
    - Surface pending revisions at session start (handled by
      AGENTS.md SessionStart)
    - Flag if active work overlaps with a pending revision's
      impact area
    - Remind the user if a revision has been pending for
      multiple sessions
</RevisionPriority>

---

<RevisionRules>
  RULES:
  - Every revision gets its own subfolder and document.
    No exceptions, regardless of size.
  - Impact analysis must be confirmed by the user before
    the revision document is created.
  - Revision phases follow the same planning, execution,
    and review process as any other phase.
  - Completed milestone documents are never modified.
    The revision document captures what needs to change —
    the original milestone documents remain as historical record.
  - A revision's success criteria must include regression
    checks for all affected features.
  - Updating tests affected by the behavior change is part of
    the revision scope. Tests that verified the old behavior
    must be updated to verify the new behavior. Failing old
    tests after a revision is expected, not a bug — but they
    must be fixed as part of the revision, not left to fail
    during phase completion.
  - SRS handling is part of revision scope. The revision
    document must state how each affected SRS requirement ID
    is treated — same ID with audit update, or supersession
    with a new ID. SRS updates are executed as part of the
    revision's phases, not deferred.
  - Revision planning never silently rewrites an existing SRS
    requirement's meaning. If the meaning changes, the prior
    requirement is preserved and a new superseding requirement
    is created per RevisionSRSImpact rules.
</RevisionRules>
