# Execution

This module defines how agents interact with tasks during execution.
It covers task creation on the kanban board, starting a gate or stream,
and applying review notes after a review cycle.

---

<TaskCreation>
  PURPOSE: Define how tasks are created on the vibe-kanban board
  when they do not already exist.

  Tasks are created from the phase document. The agent copies
  the relevant information into the kanban board using this structure:

  TITLE FORMAT:
    [Full Task ID] Task name
    Examples:
      [M2-4.0.1] Define permission levels enum
      [M2-4.A.1] Build share endpoint
      [M2-4.B.3] Filter shared documents by permission level

  DESCRIPTION STRUCTURE:
    Phase: {{Phase name}}
    Gate/Stream: {{Gate N.0 or Stream X -- Name}}
    Duration: {{Duration from phase doc}}
    Dependencies: {{Task IDs this depends on, or "None"}}

    Detail:
    {{Any additional context from the phase doc or implementation notes}}

    Review Notes:
    (empty -- populated during review)

  RULES:
  - Create ALL tasks for the gate or stream at once before
    beginning execution.
  - Do not create tasks for other gates or streams -- only the
    one the user has requested.
  - Task content must match the phase document. Do not rename,
    split, or merge tasks without user confirmation.
</TaskCreation>

---

<StartGateOrStream>
  PURPOSE: Execute the tasks in a single gate or stream.
  Triggered by user command: "Start gate N.0" or "Start stream A"

  PRECONDITIONS:
  - Phase document is loaded and contains a Test Plan section
  - docs/conventions.md is loaded (tech stack, coding standards, patterns)
  - Kanban MCP is reachable
  - User has specified which gate or stream to start

  IF the phase document does not contain a Test Plan section:
    STOP. Inform user: "This phase has no test plan. Run test
    planning before starting execution."
    Do not proceed without a Test Plan.

  FLOW:

  STEP 1 -- CHECK KANBAN
    Look up the tasks for the specified gate or stream on the kanban board.

    IF tasks do not exist:
      Create them per <TaskCreation>.

    IF tasks exist:
      Verify they match the phase document. Flag discrepancies to user.

  STEP 2 -- SET UP WORKTREE
    Load docs/core/git-execution-workflow.md. Follow its process
    to create or verify the worktree for this gate or stream.

    All task execution happens inside the worktree directory.
    Do not proceed to STEP 3 until the worktree is set up and
    the agent has navigated into it.

  STEP 3 -- EXECUTE TASKS
    Tasks are executed in dependency order. Each task follows steps
    a through g below.

    PARALLEL EXECUTION:
      IF the agent has sub-agent or parallel execution capabilities
      (e.g., Claude Code with sub-agents, Codex parallel tasks):
        - Read the Type column from the phase document's task tables.
          Tasks marked Independent have no unsatisfied dependencies
          and may be executed in parallel by sub-agents.
          Tasks marked Dependent must wait until all listed
          dependencies have reached IN-REVIEW.
        - Each sub-agent follows the SAME steps a-g below.
          There are no shortcuts for parallel execution.
        - If parallel tasks modify the same files, they cannot
          run in parallel -- treat them as sequential to avoid
          conflicts.

      IF the agent does NOT have parallel capabilities:
        - Execute tasks sequentially, one at a time, in
          dependency order.

    FOR EACH TASK:

    a. Move task to IN-PROGRESS.
    b. Write agent identity as author on the task.
       Use the name of the tool being used:
       Claude Code, Codex, OpenCode, Gemini CLI, or whichever agent is active.
       If executed by a sub-agent, note this: e.g., "Claude Code (sub-agent)".
    c. Check the Test Plan section of the phase document for this task.
       IF the task has tests mapped to it (testable):
         - Write the test(s) first, following the test ID, type,
           description, and expected result from the Test Plan.
         - Run the test(s). They should FAIL (no implementation yet).
           If a test passes before implementation, it is not testing
           the right thing -- investigate and fix the test.
         - Implement the task.
         - Run the test(s) again. They should now PASS.
         - If tests do not pass, continue implementation until they do.
       IF the task is marked as not testable:
         - Execute the task normally. No tests required.
       IF the task is marked as partially testable:
         - Write tests for the testable parts (TDD as above).
         - Execute the non-testable parts normally.
       IF the task is not in the Test Plan (e.g., a [BUG] task):
         - Write a regression test that verifies the fix before
           implementing. This follows the same TDD approach: write
           the test (it should fail, confirming the bug), implement
           the fix (test should pass).
         - If the bug is not testable (e.g., visual-only), note
           this in the task description and proceed without a test.
    d. Run linting on files modified by this task. Fix any lint errors
       before proceeding. Only lint files the agent has touched --
       pre-existing lint errors in other files are not the agent's concern.
    e. Run the tests for the current gate or stream (not the full suite).
       All tests for tasks completed so far in this gate or stream must
       pass. Fix any failures before proceeding.
       IF the test runner reports failures from OTHER streams or phases:
         Ignore them. They are not your concern during execution.
         Do not investigate, do not fix, do not stop work.
         Only failures in YOUR stream's tests block progress.
    f. Update task notes during implementation with relevant details
       (files modified, tests written, decisions made, anything the
       reviewer should know).
    g. Move task to IN-REVIEW.

    Repeat until all tasks in the gate or stream are in IN-REVIEW.

  STEP 4 -- STOP
    When all tasks in the gate or stream are in IN-REVIEW:
    - Report completion to the user.
    - Do NOT proceed to the next gate or stream.
    - Do NOT move any task to DONE.
    - Wait for the review cycle to complete.

  HARD RULES:
  - The agent NEVER moves a task to DONE. Only the reviewer does.
  - The agent works on ONE gate or stream per command.
    Do not chain gates and streams in a single session.
  - Even if all tests pass and linting is clean, the task moves
    to IN-REVIEW, not DONE.
  - If a task cannot be completed due to a blocker, leave it in
    TO-DO with a note explaining the blocker. Inform the user.
  - The agent ONLY modifies files that belong to its assigned
    gate or stream. If a task requires changes to a file owned
    by another stream, STOP and flag this to the user. Do not
    modify it -- cross-stream file conflicts can be disastrous
    when streams run in parallel.
  - The agent ONLY runs and responds to tests from its own
    gate or stream. Failures from other streams or phases are
    ignored during execution. Cross-stream regressions are the
    phase completion agent's responsibility.
</StartGateOrStream>

---

<ApplyReviewNotes>
  PURPOSE: Address review feedback left by the reviewer on tasks.
  Triggered by user command: "Address review notes for stream A"
  or "Apply review for gate N.0"

  PRECONDITIONS:
  - Phase document is loaded
  - docs/conventions.md is loaded (tech stack, coding standards, patterns)
  - Kanban MCP is reachable
  - The specified gate or stream has been through at least one
    review cycle
  - Clean tasks have already been moved to DONE by the reviewer

  FLOW:

  STEP 1 -- CHECK KANBAN AND WORKTREE
    Retrieve all tasks for the specified gate or stream that are
    in the IN-REVIEW state.

    IF no tasks are in IN-REVIEW:
      Inform user: "No tasks found in review for this gate/stream."
      STOP.

    Navigate to the worktree for this gate or stream. The worktree
    must already exist from the execution phase.
    IF it does not exist, STOP and flag to the user.

  STEP 2 -- READ REVIEW NOTES
    For each task in the specified gate or stream that is in IN-REVIEW,
    read the review notes from the task description.
    Only inspect tasks belonging to the gate or stream the user
    specified -- do not read or act on tasks from other streams.

    IF a task in IN-REVIEW has no review notes:
      Flag to user: "Task [ID] is in review but has no review notes.
      Should this be moved to done or does it need review?"
      Wait for user direction before proceeding with that task.

  STEP 3 -- ADDRESS NOTES (sequentially, one task at a time)
    For each task in the specified gate or stream that has review notes:

    a. Move task to IN-PROGRESS.
    b. Read each review note.
    c. Address the note -- make the required changes.
    d. Run linting on files modified. Fix any lint errors in those
       files only.
    e. Run the tests for the current gate or stream. All tests must
       pass. Fix any failures caused by the changes.
    f. Respond to each note on the task description, directly below
       the reviewer's comment, explaining what was done.
       Example:
         Review: "Error handling missing on share endpoint"
         Response: "Added try/catch with specific error types
         in share.controller.ts -- handles 404, 403, and 500."
    g. Move task back to IN-REVIEW.

    Repeat for the next task.

  STEP 4 -- STOP
    When all addressed tasks are back in IN-REVIEW:
    - Report to the user which tasks were addressed.
    - Do NOT move any task to DONE.
    - Wait for the reviewer to re-review.

  HARD RULES:
  - The agent NEVER moves a task to DONE, even after addressing
    review notes. Only the reviewer does.
  - Tasks move IN-PROGRESS to IN-REVIEW, never IN-PROGRESS to DONE.
  - The agent responds to every review note. No note is silently
    skipped or ignored.
  - If a review note is unclear, ask the user for clarification
    before making changes.
</ApplyReviewNotes>

---

<KanbanStates>
  The kanban board uses these states:

  TO-DO        -- Task exists but is not yet being worked on
  IN-PROGRESS  -- Task is actively being worked on by an agent
  IN-REVIEW    -- Task is complete and awaiting review
  DONE         -- Task has passed review (moved by reviewer only)

  STATE TRANSITIONS:

  During execution (StartGateOrStream):
    TO-DO to IN-PROGRESS to IN-REVIEW

  During review note application (ApplyReviewNotes):
    IN-REVIEW to IN-PROGRESS to IN-REVIEW

  During review (handled by review.md):
    IN-REVIEW to DONE (if clean)
    IN-REVIEW stays in IN-REVIEW with notes (if changes needed)

  FORBIDDEN TRANSITIONS:
  - Execution agent NEVER moves to DONE
  - No task skips IN-REVIEW
  - No task moves backward from DONE
</KanbanStates>

---

<ProjectProgressUpdate>
  Execution agents do NOT update phase status or milestone status
  in project-progress.md. Phase and milestone status changes are
  handled exclusively by the phase completion agent.

  Execution agents MAY append to the Decisions section of
  project-progress.md when a significant architectural decision
  is made during task execution that affects the project direction.
  This is the only write an execution agent makes to project-progress.md.
</ProjectProgressUpdate>
