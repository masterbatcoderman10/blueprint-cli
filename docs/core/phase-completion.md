# Phase Completion

This module defines the phase completion workflow. Phase completion
is a verification gate that runs after all tasks in a phase have
been reviewed and moved to DONE. It validates the phase as a whole,
runs the full test suite across the entire project, and either
confirms completion or creates bug tasks for regressions.

This module is the ONLY place where phase status and milestone
status in project-progress.md are updated. No other agent or
module writes to these fields.

---

<PhaseCompletionProcess>
  PURPOSE: Verify that a phase is fully complete, the entire project
  test suite passes, and update project state accordingly.

  Triggered by user command:
    - "Phase completion"
    - "Complete the phase"
    - "Run phase completion"

  PRECONDITIONS:
  - docs/project-progress.md is loaded
  - docs/conventions.md is loaded (testing framework, test commands)
  - Kanban MCP is reachable
  - The phase document for the current phase is loaded

  FLOW:

  STEP 1 — IDENTIFY THE PHASE
    Read project-progress.md to determine the current phase.
    Load the phase document if not already loaded.

    IF project-progress.md does not reference a current phase:
      → STOP. Inform user: "No active phase found in project-progress.md."

  STEP 2 — VERIFY KANBAN STATE
    Retrieve ALL tasks for the current phase from the kanban board.
    This includes every task from the gate and every stream.

    CHECK — Are all tasks in DONE?

    IF any tasks are in TO-DO or BACKLOG:
      → STOP. Report which tasks are not complete.
        "Phase completion cannot proceed. The following tasks
        are still in {{state}}: {{list of task IDs and names}}"

    IF any tasks are in REVIEW:
      → STOP. Report which tasks are still awaiting review.
        "Phase completion cannot proceed. The following tasks
        are still in review: {{list of task IDs and names}}"

    IF all tasks are in DONE:
      → Continue to STEP 3.

  STEP 3 — VERIFY DEFINITION OF DONE
    Read the Definition of Done from the phase document.
    Check each item against the current state of the project.

    IF any DoD item is not satisfied:
      → Report which items fail and why.
      → The user decides whether to address them before
        proceeding or to override. Do not auto-override.

    IF all DoD items are satisfied:
      → Continue to STEP 4.

  STEP 4 — RUN FULL TEST SUITE
    Run the COMPLETE test suite for the entire project. This is not
    scoped to the current phase — it includes tests from every
    phase and milestone that has been completed, plus the current
    phase's tests.

    Use the test execution command defined in conventions.md.

    IF all tests pass:
      → Continue to STEP 5.

    IF tests fail:
      → GOTO <RegressionHandling>.

  STEP 5 — UPDATE PROJECT STATE
    All checks passed. Update project-progress.md:

    a. Set the current phase status to Complete.
    b. Add a decision entry:
       "{{YYYY-MM-DD}}: Phase {{N}} — {{Name}} completed.
       All tasks done, DoD satisfied, full test suite green."
    c. Check if this was the last phase in the current milestone.
       IF yes:
         - Update the milestone status to Complete in the
           Milestone Overview table.
         - Add a decision entry:
           "{{YYYY-MM-DD}}: Milestone {{N}} — {{Name}} completed.
           All phases done."
       IF no:
         - Update the current phase reference to the next phase
           if it is known. If the next phase has not been planned,
           set current phase to "TBD — pending phase planning".
    d. Update the Phase Graph with the completed phase
       (mark it with ✓).

    Report to the user:
    - "Phase {{N}} — {{Name}} is complete."
    - If milestone completed: "Milestone {{N}} — {{Name}} is also
      complete."
    - Suggest next action: "Next step is to plan the next phase"
      or "Next step is to plan the next milestone" as appropriate.
</PhaseCompletionProcess>

---

<RegressionHandling>
  PURPOSE: Handle test failures discovered during the full test
  suite run in STEP 4.

  When tests fail during phase completion, they fall into two
  categories:

  CURRENT PHASE FAILURES — Tests from the current phase that fail.
    These should have been caught during stream review. Their
    presence here means either the review missed them or a
    cross-stream interaction caused the failure.

  REGRESSION FAILURES — Tests from previous phases or milestones
    that were passing before and now fail.
    These mean the current phase's work broke something that was
    previously working.

  FLOW:

  STEP 1 — CATEGORIZE FAILURES
    For each failing test:
    a. Identify which phase the test belongs to (from the test ID
       prefix or test file location).
    b. Classify as current phase failure or regression.

  STEP 2 — REPORT TO USER
    Present a structured report:

    "Phase completion found {{N}} test failure(s):"

    Current Phase Failures:
    - {{Test ID}}: {{what failed and why}}

    Regressions (tests from previous phases now failing):
    - {{Test ID}} (from Phase {{X}}): {{what failed and why}}

  STEP 3 — CREATE BUG TASKS
    For each failure, create a bug task on the kanban board.

    TITLE FORMAT:
      [BUG] {{Test ID}} — {{short description of failure}}

    DESCRIPTION:
      Discovered during: Phase completion for Phase {{N}} — {{Name}}
      Failing test: {{Test ID}}
      Test belongs to: {{Phase and stream the test was written for}}
      Test output: {{Error message or failure output}}

      Review Notes:
      (empty — populated during review)

    Each bug task goes to BACKLOG on the kanban board.

    The phase completion agent does NOT diagnose root causes,
    investigate the codebase, or propose fixes. It records what
    failed and hands off. When the execution agent picks up
    these tasks, they load bug-resolution.md and follow its
    diagnostic process. The failing test serves as reproduction,
    so the bug agent may begin at STEP 3 (diagnosis) of
    bug-resolution.md.

  STEP 4 — PHASE REMAINS INCOMPLETE
    Do NOT update project-progress.md phase status.
    The phase stays in its current state.

    Inform the user:
    "Phase completion blocked by {{N}} test failure(s).
    Bug tasks have been created on the kanban board.
    After bugs are resolved, run phase completion again."

    The user then addresses the bugs through the normal
    execution and review cycle. When all bugs are resolved,
    the user triggers phase completion again. The loop
    repeats until the full test suite is green.
</RegressionHandling>

---

<PhaseCompletionRules>
  RULES:
  - Phase completion is the ONLY workflow that updates phase status
    and milestone status in project-progress.md. No other agent
    or module writes to these fields.
  - Phase completion requires ALL kanban tasks in DONE. There are
    no partial completions.
  - The full test suite must pass. There are no exceptions or
    overrides for test failures. If tests fail, bugs must be
    fixed and phase completion re-run.
  - The user may override a Definition of Done item if they
    explicitly choose to, but test failures cannot be overridden.
  - Phase completion does not auto-advance to the next phase.
    It updates state and suggests next actions. The user decides
    when to proceed.
  - If a regression is found, the bug-resolution.md module defines
    the task format. The phase completion agent creates the tasks
    but does not execute the fixes — that is the execution agent's
    job.
</PhaseCompletionRules>
