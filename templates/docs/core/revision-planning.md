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

    Present the full analysis to the user:
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
</RevisionRules>
