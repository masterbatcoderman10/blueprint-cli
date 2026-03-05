# Task Management Protocol

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
    [Gate/Stream ID] Task name
    Examples:
      [4.0.1] Define permission levels enum
      [A.1] Build share endpoint
      [B.3] Filter shared documents by permission level

  DESCRIPTION STRUCTURE:
    Phase: {{Phase name}}
    Gate/Stream: {{Gate N.0 or Stream X — Name}}
    Duration: {{Duration from phase doc}}
    Dependencies: {{Task IDs this depends on, or "None"}}

    Detail:
    {{Any additional context from the phase doc or implementation notes}}

    Review Notes:
    (empty — populated during review)

  RULES:
  - Create ALL tasks for the gate or stream at once before
    beginning execution.
  - Do not create tasks for other gates or streams — only the
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
    → STOP. Inform user: "This phase has no test plan. Run test
      planning before starting execution."
    → Do not proceed without a Test Plan.

  FLOW:

  STEP 1 — CHECK KANBAN
    Look up the tasks for the specified gate or stream on the kanban board.

    IF tasks do not exist:
      → Create them per <TaskCreation>.

    IF tasks exist:
      → Verify they match the phase document. Flag discrepancies to user.

  STEP 2 — EXECUTE TASKS
    Tasks are executed in dependency order. Each task follows steps
    a through g below.

    PARALLEL EXECUTION:
      IF the agent has sub-agent or parallel execution capabilities
      (e.g., Claude Code with sub-agents, Codex parallel tasks):
        - Identify tasks whose dependencies are ALL satisfied.
        - Tasks with no unsatisfied dependencies are INDEPENDENT
          and may be executed in parallel by sub-agents.
        - Each sub-agent follows the SAME steps a–g below.
          There are no shortcuts for parallel execution.
        - A dependent task may only begin once ALL of its
          dependencies have reached REVIEW.
        - If parallel tasks modify the same files, they cannot
          run in parallel — treat them as sequential to avoid
          conflicts.

      IF the agent does NOT have parallel capabilities:
        - Execute tasks sequentially, one at a time, in
          dependency order.

    FOR EACH TASK:

    a. Move task to TO-DO.
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
           the right thing — investigate and fix the test.
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
       before proceeding. Only lint files the agent has touched — 
       pre-existing lint errors in other files are not the agent's concern.
    e. Run the tests for the current gate or stream (not the full suite).
       All tests for tasks completed so far in this gate or stream must
       pass. Fix any failures before proceeding.
    f. Update task notes during implementation with relevant details
       (files modified, tests written, decisions made, anything the
       reviewer should know).
    g. Move task to REVIEW.

    Repeat until all tasks in the gate or stream are in REVIEW.

  STEP 3 — STOP
    When all tasks in the gate or stream are in REVIEW:
    - Report completion to the user.
    - Do NOT proceed to the next gate or stream.
    - Do NOT move any task to DONE.
    - Wait for the review cycle to complete.

  HARD RULES:
  - The agent NEVER moves a task to DONE. Only the reviewer does.
  - The agent works on ONE gate or stream per command.
    Do not chain gates and streams in a single session.
  - Even if all tests pass and linting is clean, the task moves
    to REVIEW, not DONE.
  - If a task cannot be completed due to a blocker, leave it in
    TO-DO with a note explaining the blocker. Inform the user.
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

  STEP 1 — CHECK KANBAN
    Retrieve all tasks for the specified gate or stream that are
    in the REVIEW state.

    IF no tasks are in REVIEW:
      → Inform user: "No tasks found in review for this gate/stream."
      → STOP.

  STEP 2 — READ REVIEW NOTES
    For each task in the specified gate or stream that is in REVIEW,
    read the review notes from the task description.
    Only inspect tasks belonging to the gate or stream the user
    specified — do not read or act on tasks from other streams.

    IF a task in REVIEW has no review notes:
      → Flag to user: "Task [ID] is in review but has no review notes.
        Should this be moved to done or does it need review?"
      → Wait for user direction before proceeding with that task.

  STEP 3 — ADDRESS NOTES (sequentially, one task at a time)
    For each task in the specified gate or stream that has review notes:

    a. Move task to TO-DO.
    b. Read each review note.
    c. Address the note — make the required changes.
    d. Run linting on files modified. Fix any lint errors in those
       files only.
    e. Run the tests for the current gate or stream. All tests must
       pass. Fix any failures caused by the changes.
    f. Respond to each note on the task description, directly below
       the reviewer's comment, explaining what was done.
       Example:
         Review: "Error handling missing on share endpoint"
         → Response: "Added try/catch with specific error types
           in share.controller.ts — handles 404, 403, and 500."
    g. Move task back to REVIEW.

    Repeat for the next task.

  STEP 4 — STOP
    When all addressed tasks are back in REVIEW:
    - Report to the user which tasks were addressed.
    - Do NOT move any task to DONE.
    - Wait for the reviewer to re-review.

  HARD RULES:
  - The agent NEVER moves a task to DONE, even after addressing
    review notes. Only the reviewer does.
  - Tasks move TO-DO → REVIEW, never TO-DO → DONE.
  - The agent responds to every review note. No note is silently
    skipped or ignored.
  - If a review note is unclear, ask the user for clarification
    before making changes.
</ApplyReviewNotes>

---

<KanbanStates>
  The kanban board uses these states:

  BACKLOG  — Task exists but is not yet being worked on
  TO-DO    — Task is actively being worked on by an agent
  REVIEW   — Task is complete and awaiting review
  DONE     — Task has passed review (moved by reviewer only)

  STATE TRANSITIONS:

  During execution (StartGateOrStream):
    BACKLOG → TO-DO → REVIEW

  During review note application (ApplyReviewNotes):
    REVIEW → TO-DO → REVIEW

  During review (handled by review.md):
    REVIEW → DONE (if clean)
    REVIEW → stays in REVIEW with notes (if changes needed)

  FORBIDDEN TRANSITIONS:
  - Execution agent NEVER moves to DONE
  - No task skips REVIEW
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
