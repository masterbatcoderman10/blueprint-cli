# Tweak Planning

This module defines how to plan and execute a tweak — a lightweight,
in-phase correction to one or more completed tasks. A tweak is the
smallest formal change contract in Blueprint.

Tweaks exist because mid-execution discoveries (misalignment with
the knowledge base, self-review findings, small scope corrections)
sometimes require changes to work that is already done, but do not
warrant a full revision.

---

<TweakDefinition>
  A tweak is a correction to completed tasks within a single phase.

  A tweak IS:
    - Scoped to one phase — it cannot cross phase boundaries
    - Tracked in the phase document's Tweaks section
    - User-initiated — the agent does not unilaterally create tweaks
    - Subject to test requirements — new or modified tests are expected

  A tweak is NOT:
    - A revision — revisions span milestones and get their own documents
    - A bug fix — bugs are defects in implemented behavior; tweaks are
      alignment corrections to work that functions but doesn't match
      prior context (knowledge base, PRD, conventions)
    - A way to add new scope — tweaks correct existing tasks, they do
      not introduce new features or capabilities
</TweakDefinition>

---

<TweakTrigger>
  A tweak is appropriate when ALL of the following are true:

  1. One or more tasks in the current phase are already complete
     (IN-REVIEW or DONE)
  2. Those tasks need correction — typically because they don't align
     with the knowledge base, PRD, conventions, or other prior context
  3. The correction can be fully contained within the current phase
     (no files or contracts outside this phase are affected)
  4. The user explicitly requests the tweak

  IF condition 3 is NOT met — the correction affects other phases,
  milestones, or cross-cutting contracts — it is NOT a tweak.
  Route to docs/core/revision-planning.md instead.
</TweakTrigger>

---

<TweakProcess>
  PURPOSE: Scope, plan, and track an in-phase correction.

  PRECONDITIONS:
  - The phase document is loaded
  - docs/conventions.md is loaded
  - The phase is actively in progress or in review
  - The user has identified what needs correction and why

  STEP 1 — UNDERSTAND THE CORRECTION
    Clarify with the user:
    - Which completed task(s) need correction?
    - What is wrong — what is the misalignment?
    - What is the source of truth (knowledge base doc, PRD section,
      convention) that the task should align with?

    Do not proceed until the correction is clearly scoped.

  STEP 2 — SCOPE CHECK
    Verify the correction is containable within this phase:
    - Does it only affect files touched by this phase's tasks?
    - Does it require changes to other phases' outputs?
    - Does it change any contract or interface used by other phases?

    IF the correction escapes this phase's boundary:
      STOP. Inform user: "This correction affects scope outside this
      phase. It should be handled as a revision, not a tweak."
      Route to docs/core/revision-planning.md.

  STEP 3 — PLAN THE TWEAK
    Create a tweak entry in the phase document's Tweaks section
    using the format defined in <TweakFormat>.

    The tweak entry includes:
    - Tweak ID
    - Which task(s) it corrects
    - What the correction is
    - What the source of truth is
    - Test impact — new tests, modified tests, or both
    - Status

  STEP 4 — EXECUTE THE TWEAK
    Execute the correction following the same discipline as normal
    task execution:

    a. Move the tweak status to in-progress in the phase document.
    b. If tests are affected:
       - Write or modify tests first (TDD).
       - Run tests — new tests should fail, modified tests may fail.
       - Implement the correction.
       - Run tests — all should pass.
    c. If no tests are affected (rare — justify in the tweak entry):
       - Implement the correction directly.
    d. Run linting on modified files.
    e. Run the gate or stream's test suite — all must pass.
    f. Update the tweak status to done.

  STEP 5 — UPDATE KANBAN
    Add a note to each affected task on the kanban board referencing
    the tweak ID and what was changed. This preserves traceability
    between the task's original work and the correction.
</TweakProcess>

---

<TweakFormat>
  Tweaks are recorded in the Tweaks section at the end of the phase
  document (after Test Scenarios or Test Plan).

  TWEAK ID FORMAT:
    <phase prefix>.TW<seq>

    The phase prefix comes from the phase document header — the same
    prefix used for task IDs. The sequence number is a simple integer
    with no hyphens.

    Examples:
      M1-3.TW1      — First tweak in Milestone 1, Phase 3
      R2-1.TW1      — First tweak in Revision 2, Phase 1
      M2-2.TW3      — Third tweak in Milestone 2, Phase 2

  SECTION FORMAT:

  ## Tweaks

  > Corrections to completed tasks within this phase are tracked here.
  > Each tweak has an ID, lists affected tasks, and includes test impact.

  ### <Tweak ID> — <Short description>

  - **Corrects:** <Task ID(s)>
  - **Reason:** <What is misaligned and why>
  - **Source of truth:** <Knowledge base doc, PRD section, or convention>
  - **Changes:** <What will be modified — files, behavior, output>
  - **Test impact:** <New tests | Modified tests | None (with justification)>
  - **Status:** pending | in-progress | done

  EXAMPLE:

  ### M1-3.TW1 — Align template paths with knowledge base naming

  - **Corrects:** M1-3.A.2, M1-3.A.3
  - **Reason:** Template output paths use camelCase but the knowledge
    base specifies kebab-case for all generated files.
  - **Source of truth:** docs/knowledge-base/naming-conventions.md
  - **Changes:** Update path generation in src/templates/resolver.ts
    and src/templates/writer.ts to use kebab-case.
  - **Test impact:** Modified — T-M1-3.A.2 and T-M1-3.A.3 expected
    values change from camelCase to kebab-case.
  - **Status:** done
</TweakFormat>

---

<TweakRules>
  RULES:

  RULE 1 — USER-INITIATED ONLY
    The agent does not create tweaks autonomously. The user must
    request the correction. The agent may suggest that a tweak is
    needed, but must wait for user confirmation before creating one.

  RULE 2 — ONE PHASE ONLY
    A tweak cannot span multiple phases. If the correction requires
    changes outside the current phase, it is a revision.

  RULE 3 — NO NEW SCOPE
    Tweaks correct existing work. They do not add new tasks, new
    features, or new capabilities. If the user's request is additive
    rather than corrective, route to docs/core/scope-change.md.

  RULE 4 — TESTS ARE EXPECTED
    Most tweaks will require test changes — either modifying existing
    tests to match the corrected behavior or adding new tests to
    cover the correction. A tweak with no test impact must justify
    why in the tweak entry.

  RULE 5 — TRACKED IN THE PHASE DOCUMENT
    Every tweak is recorded in the Tweaks section. No informal
    corrections. If it changes completed work, it gets a tweak entry.

  RULE 6 — KANBAN TRACEABILITY
    Affected kanban tasks must reference the tweak ID so the
    reviewer can trace what changed and why.
</TweakRules>

---

<TweakVsRevision>
  Use this decision guide when the boundary is unclear:

  ┌──────────────────────────────────┬─────────┬──────────┐
  │ Question                         │ Tweak   │ Revision │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Scoped to one phase?             │ Yes     │ No       │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Affects files from other phases? │ No      │ Yes      │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Changes a cross-phase contract   │ No      │ Yes      │
  │ or interface?                    │         │          │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Adds new capabilities?           │ No      │ Possibly │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Needs its own phases to execute? │ No      │ Yes      │
  ├──────────────────────────────────┼─────────┼──────────┤
  │ Corrects alignment with prior    │ Yes     │ Maybe    │
  │ context?                         │         │          │
  └──────────────────────────────────┴─────────┴──────────┘

  IF all answers point to Tweak → use this module.
  IF any answer points to Revision → use docs/core/revision-planning.md.
  IF mixed → default to revision. It is safer to over-scope than
  to under-scope a correction.
</TweakVsRevision>
