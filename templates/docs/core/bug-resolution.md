# Bug Resolution

This module handles diagnosing and resolving bugs — situations where
existing functionality does not work as intended. A bug is not a
revision (changing desired behavior) or a scope change (adding new
capability). A bug means the implementation does not match what was
specified.

---

<BugResolutionProcess>
  PURPOSE: Diagnose and resolve bugs — situations where existing
  functionality does not work as intended.

  Bugs enter this module through two paths:

  PATH A — EXISTING BUG TASK
    A bug task already exists on the kanban board, typically created
    by the phase completion agent from a failing test. The task
    contains the symptom, test output, and which phase the test
    belongs to. Reproduction is already handled — the failing test
    is the reproduction.
    → Start at STEP 3 (Diagnose the Root Cause).

  PATH B — USER-REPORTED BUG
    A user reports something broken. No bug task exists yet.
    The symptom needs to be clarified, the bug needs to be
    reproduced, and a task needs to be created after diagnosis.
    → Start at STEP 1 (Clarify the Symptom).

  Triggered when:
    - An agent picks up a [BUG] task from the kanban board (Path A)
    - A user reports something is broken or not working correctly (Path B)
    - Unexpected behavior is observed during development or production (Path B)

  PRECONDITIONS:
  - docs/conventions.md is loaded (tech stack, available tools, patterns)
  - Kanban MCP is reachable
  - Phase document for the current phase is loaded (if one is active)

  ENTRY POINT:
    Check the kanban board for existing bug tasks related to the
    reported issue.

    IF a [BUG] task exists on the board for this issue:
      → PATH A. Read the task description for symptom and test
        output. Skip to STEP 3.

    IF no bug task exists:
      → PATH B. Begin at STEP 1.

  FLOW:

  STEP 1 — CLARIFY THE SYMPTOM (Path B only)
    Before investigating anything, understand the problem precisely.

    Establish:
      - What is the observed behavior? (what actually happens)
      - What is the expected behavior? (what should happen)
      - When does it occur? (always, intermittently, under specific
        conditions)
      - When was it last known to work? (if the user knows)
      - Is this in active development or in production?

    Do not skip this step. Do not begin searching the codebase
    based on a vague report. A precise symptom description
    determines where to look and prevents wasted investigation.

    IF the user cannot articulate expected behavior clearly:
      Check whether the relevant phase document or PRD defines
      the behavior. If it does, reference it. If it does not,
      clarify with the user before proceeding.

  STEP 2 — REPRODUCE THE PROBLEM (Path B only)
    Reproduction confirms the bug exists and provides a concrete
    trace to work from. Use whatever tools and methods are
    available in the project as defined in conventions.md.

    Reproduction methods (use whichever apply to the project):
      - Run the relevant test suite to see if a test captures it
      - Execute the code path manually (API call, script, CLI command)
      - Use browser or UI testing tools if available and applicable
      - Check application logs, error output, or monitoring data
      - Review recent test results or CI output

    IF the agent can reproduce the bug:
      → Record the reproduction steps and observed output.
      → Continue to STEP 3.

    IF the agent cannot reproduce the bug:
      → Create a structured reproduction checklist for the user.
        The checklist should be specific, sequential, and include
        what to observe at each step (e.g., "open the network tab
        before clicking submit", "check the terminal output after
        running the command").
      → Ask the user to follow the steps and report back with
        the output, error messages, or screenshots.
      → Wait for user input before proceeding to STEP 3.

    IF the bug cannot be reproduced by either agent or user:
      → Inform the user. A bug that cannot be reproduced cannot
        be reliably fixed. Record the report on the kanban board
        with status TO-DO and all known details. The user
        decides whether to investigate further or wait for
        recurrence.
      → STOP.

  STEP 3 — DIAGNOSE THE ROOT CAUSE (both paths)
    Trace the problem to its source. For Path A, the failing test
    output points to what broke — use it as a starting point.
    For Path B, use the reproduction output.

    The agent uses its strengths here — searching the codebase,
    reading stack traces, following call chains, examining data flow.
    There is no prescribed sequence; the agent investigates however
    is most effective for the specific problem.

    However, the agent SHOULD use available project context:
      - Phase documents describe what the code was intended to do
      - conventions.md defines the patterns the code should follow
      - Implementation notes on kanban tasks (if accessible) record
        what decisions were made during development

    The diagnosis is complete when the agent can state:
      a. The root cause — why the bug occurs
      b. The location — which files, functions, or modules are involved
      c. The fix approach — what needs to change to resolve it

    Present the diagnosis to the user before proceeding.
    Do not begin fixing without user confirmation of the approach.

  STEP 4 — CLASSIFY AND ROUTE (both paths)
    Based on the diagnosis, determine how the fix proceeds.

    CONTAINED FIX — The root cause is localized. The fix touches
      a small number of files and does not change any interfaces,
      data models, or architectural patterns.
      → Path A: Update the existing bug task description with
        root cause, fix approach, and files affected. Execute
        using execution.md.
      → Path B: Create a bug fix task per <BugTaskCreation>.
        Execute using execution.md.

    MULTI-FILE FIX — The root cause spans several files or concerns
      but is still a straightforward correction, not a design change.
      → Path A: Update the existing bug task and create additional
        tasks if the fix requires multiple logical units of work.
      → Path B: Create multiple bug fix tasks on the kanban board,
        one per logical unit of work.
      → Execute using execution.md.

    DESIGN FLAW — The investigation reveals that the code is working
      as written, but the design itself is wrong. The intended behavior
      (as specified in phase docs or PRD) is correct, but the approach
      taken to implement it is fundamentally flawed and needs rethinking.
      → This is no longer a bug fix. Load docs/core/revision-planning.md.
      → The revision process handles impact analysis and planning.
      → Record the escalation in the kanban task notes and in the
        Decisions section of project-progress.md.

    IF the agent is unsure about classification, present the options
    to the user and let them decide.
</BugResolutionProcess>

---

<BugTaskCreation>
  Bug fix tasks are created on the kanban board with a distinct
  format so they are identifiable as bug fixes rather than planned
  feature work.

  TITLE FORMAT:
    [BUG] Short description of the fix
    Examples:
      [BUG] Fix email validation on share endpoint
      [BUG] Correct date parsing in attendance export
      [BUG] Resolve race condition in real-time sync

  DESCRIPTION STRUCTURE:
    Symptom: {{What was observed}}
    Expected: {{What should have happened}}
    Root Cause: {{Why the bug occurs}}
    Fix Approach: {{What needs to change}}
    Files Affected: {{List of files to modify}}

    Reproduction:
    {{Steps to reproduce, or reference to test that captures it}}

    Review Notes:
    (empty — populated during review)

  RULES:
  - Bug fix tasks go through the same TO-DO -> IN-PROGRESS -> IN-REVIEW -> DONE
    cycle as any other task.
  - The executing agent NEVER moves a bug fix task to DONE.
    Review is required, same as feature work.
  - If the bug fix modifies code that was built in a prior phase,
    the agent must run existing tests for that area in addition to
    verifying the fix itself.
  - If no tests exist for the affected area, note this in the task
    description. The reviewer should consider whether a regression
    test is needed.
</BugTaskCreation>

---

<BugTaskExecution>
  Bug fix tasks follow the same execution steps as any task
  in execution.md, but they work on main (no worktree) and
  do not belong to a gate or stream.

  FOR EACH BUG TASK:

  a. Move task to IN-PROGRESS.
  b. Write agent identity as author on the task.
  c. Write a regression test that reproduces the bug (TDD).
     The test should FAIL before the fix and PASS after.
     If the bug is not testable (e.g., visual-only), note
     this in the task description and proceed without a test.
  d. Implement the fix.
  e. Run linting on files modified. Fix lint errors.
  f. Run the tests for the affected area. All tests must pass.
     If the fix touches code from a prior phase, run that
     phase's tests as well.
  g. Update task notes with files modified, test written,
     and what was changed.
  h. Commit per docs/core/git-execution-workflow.md CommitOnCompletion.
  i. Move task to IN-REVIEW.

  After all bug tasks are in IN-REVIEW, the reviewer picks
  them up through the normal review process in review.md.
  Bug fix reviews follow the same ReviewProcess — the reviewer
  examines the code on main, checks the regression test,
  and either marks clean or leaves notes.

  The executing agent NEVER moves a bug fix task to DONE.
</BugTaskExecution>

---

<ActiveDevelopmentBugs>
  Bugs discovered during active development (current phase) have
  a shorter path when the origin is clear.

  IF a task is still in IN-REVIEW and the bug is clearly caused by
  that task's implementation:
    → This is a review concern, not a bug resolution concern.
    → The reviewer handles it as a review note per review.md.
    → The executing agent addresses it via ApplyReviewNotes
      in execution.md.
    → Do not create a separate bug task.

  IF a task is already in DONE and the bug is discovered afterward:
    → Go through the full diagnostic process (STEPS 1-4 above).
    → Even if the origin task seems obvious, confirm through
      diagnosis. Assumptions about bug origins are frequently wrong.

  IF the bug is found during development but its origin is unclear:
    → Go through the full diagnostic process.
</ActiveDevelopmentBugs>

---

<BugResolutionRules>
  RULES:
  - Check the kanban board first. If a bug task already exists
    (e.g., from phase completion), start at diagnosis. If not,
    start at clarification.
  - For user-reported bugs (Path B): always clarify before
    investigating, always reproduce before diagnosing.
  - For test-identified bugs (Path A): the failing test is the
    reproduction. Begin diagnosis from the test output.
  - Always diagnose before fixing. Present the root cause and
    fix approach to the user before making changes.
  - Bug fix tasks go through review, same as all other tasks.
    The agent never moves them to DONE.
  - If diagnosis reveals a design flaw rather than an implementation
    error, escalate to revision-planning.md. Do not attempt a
    workaround that leaves the design flaw in place.
  - Record the bug and its resolution in the Decisions section of
    project-progress.md if it reveals something important about
    the codebase or if it affects other planned work.
</BugResolutionRules>
