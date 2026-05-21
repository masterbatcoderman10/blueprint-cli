# Execution

This module defines how agents interact with tasks during execution.
It covers task creation on the local tracker, starting a gate or stream,
and applying review notes after a review cycle.

---

<TaskCreation>
  PURPOSE: Define how tasks are created on the local tracker
  when they do not already exist.

  Tasks are created from the phase document. The agent copies
  the relevant information into the tracker using this structure:

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

  RULES:
  - Do not duplicate the stream title in the description body; the
    Gate/Stream field already identifies the stream.
  - Do not scaffold a Review Notes section in the description.
    Review feedback is left as tracker comments via
    `POST /tasks/:id/comments`, not as task-description prose.
  - Create ALL tasks for the gate or stream at once before
    beginning execution.
  - Do not create tasks for other gates or streams -- only the
    one the user has requested.
  - Task content must match the phase document. Do not rename,
    split, or merge tasks without user confirmation.
  - Use the tracker API recipes defined in `docs/core/tracker.md`
    for task creation and updates.
</TaskCreation>

---

<StartGateOrStream>
  PURPOSE: Execute the tasks in a single gate or stream.
  Triggered by user command: "Start gate N.0" or "Start stream A"

  PRECONDITIONS:
  - Phase document is loaded and contains a Test Plan section
  - docs/conventions.md is loaded (tech stack, coding standards, patterns)
  - Local tracker server is reachable
  - User has specified which gate or stream to start

  NOTE ON TWEAK DOCUMENTS:
    Tweak documents (`docs/tweaks/tweak-<n>-<slug>.md`) are valid
    execution sources alongside phase documents. When executing a
    tweak, the agent follows the same StartGateOrStream flow, with
    the two additional gates defined in <TweakExecutionGates> below.
    Tweak documents do not contain a formal Test Plan section; the
    agent relies on the existing project test suite for verification.

  CONTEXT INFERENCE:
    The current milestone and phase are read from
    docs/project-progress.md. When the user says "start stream A"
    or "start gate", infer the milestone and phase from
    project-progress.md. Do NOT ask the user which milestone
    or phase they mean unless project-progress.md is ambiguous
    or does not reference an active phase.

  IF the phase document does not contain a Test Plan section:
    STOP. Inform user: "This phase has no test plan. Run test
    planning before starting execution."
    Do not proceed without a Test Plan.

  FLOW:

  STEP 1 -- CHECK TRACKER
    Look up the tasks for the specified gate or stream on the tracker.
    Use `GET /tasks?phase=<phase>&stream=<stream>` as documented
    in `docs/core/tracker.md`.

    FILTERED LOOKUP GUIDANCE:
    When milestone, phase, and stream context are all available
    (as they typically are during execution), use the query
    parameters to narrow results:
      GET /tasks?phase=R8-1&stream=A
    This returns only the tasks for the target gate or stream,
    avoiding the need to filter client-side from a larger set.
    The phase value is the phase ID prefix (e.g., "R8-1"),
    and the stream value is the stream letter (e.g., "A")
    or "0" for the gate.

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

    a. Move task to IN-PROGRESS using `POST /tasks/:id/start`.
       ```bash
       curl -X POST http://127.0.0.1:7300/tasks/<id>/start \
         -H "Content-Type: application/json"
       ```
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
           If tests do not pass, continue implementation until they do.
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
    g. Move task to IN-REVIEW using `POST /tasks/:id/submit`.
       ```bash
       curl -X POST http://127.0.0.1:7300/tasks/<id>/submit \
         -H "Content-Type: application/json"
       ```

    Repeat until all tasks in the gate or stream are in IN-REVIEW.

  STEP 4 -- COMMIT AND STOP
    When all tasks in the gate or stream are in IN-REVIEW:
    - Commit per docs/core/git-execution-workflow.md CommitOnCompletion.
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

<TweakExecutionGates>
  PURPOSE: Define two explicit gates that apply when executing tweak
  tasks. These gates block execution on failure.

  GATE 1 — TWEAK-START GATE
    No tweak task may transition from **TO-DO** to **IN-PROGRESS**
    until the user has explicitly confirmed the drafted tweak plan.

    This gate is enforced by the agent protocol, not by code. The
    agent must:
      - Present the drafted tweak document to the user in full.
      - Wait for explicit confirmation ("yes", "proceed", "looks fine").
      - Re-loop the draft on requested changes.
      - Only after confirmation move the first task to IN-PROGRESS.

    IF the user has not confirmed: STOP. Do not move any task out
    of TO-DO. Re-present the draft and wait.

  GATE 2 — TWEAK-COMPLETION GATE
    The full project test suite (`npm test`) must pass before a
    tweak's terminal task is marked **DONE**.

    This gate is enforced at review time. The reviewer:
      - Runs `npm test` before moving the terminal tweak task to DONE.
      - If the suite fails: leaves the task in IN-REVIEW (or moves
        it to REWORK with notes) until the suite is green.
      - If the suite passes: may move the terminal task to DONE.

    The executing agent also runs the full project test suite before
    marking its final task complete, as a self-check.

  HARD RULES:
    - Both gates block execution on failure. There are no overrides.
    - The tweak-start gate is mandatory for every tweak, regardless
      of size or urgency.
    - The tweak-completion gate is mandatory for every tweak. A green
      test suite is non-negotiable.
    - These gates apply ONLY to tweaks. Phase and milestone execution
      follows the normal rules defined in <StartGateOrStream>.
</TweakExecutionGates>

---

<ApplyReviewNotes>
  PURPOSE: Address review feedback left by the reviewer on tasks.
  Triggered by user command: "Address review notes for stream A"
  or "Apply review for gate N.0"

  PRECONDITIONS:
  - Phase document is loaded
  - docs/conventions.md is loaded (tech stack, coding standards, patterns)
  - Local tracker server is reachable
  - The specified gate or stream has been through at least one
    review cycle
  - Clean tasks have already been moved to DONE by the reviewer

  CONTEXT INFERENCE:
    Same as StartGateOrStream -- infer the current milestone and
    phase from docs/project-progress.md. Do not ask the user
    unless project-progress.md is ambiguous.

  FLOW:

  STEP 1 -- CHECK TRACKER AND WORKTREE
    Retrieve all tasks for the specified gate or stream that are
    in the IN-REVIEW or REWORK state.

    Use filtered lookup when milestone, phase, and stream context
    are available:
      GET /tasks?phase=<phase>&stream=<stream>
    Then filter the results for IN-REVIEW or REWORK state.

    IF no tasks are in IN-REVIEW or REWORK:
      Inform user: "No tasks found in review or rework for this gate/stream."
      STOP.

    Navigate to the worktree for this gate or stream. The worktree
    must already exist from the execution phase.
    IF it does not exist, STOP and flag to the user.

  STEP 2 -- READ REVIEW COMMENTS
    For each task in the specified gate or stream that is in IN-REVIEW
    or REWORK, retrieve the review comments from the tracker.
    Use `GET /tasks/:id/comments` as documented in
    `docs/core/tracker.md`.
    Only inspect tasks belonging to the gate or stream the user
    specified -- do not read or act on tasks from other streams.

    IF a task in IN-REVIEW has no review comments:
      Flag to user: "Task [ID] is in review but has no review comments.
      Should this be moved to done or does it need review?"
      Wait for user direction before proceeding with that task.

  STEP 3 -- ADDRESS COMMENTS (sequentially, one task at a time)
    For each task in the specified gate or stream that has review
    comments:

    a. If the task is in REWORK, move it to IN-PROGRESS using
       `POST /tasks/:id/resume`.
       If the task is in IN-REVIEW, move it to IN-PROGRESS using
       `PATCH /tasks/:id` (this is a non-canonical transition; the
       gated endpoints cover the five canonical transitions only).
    b. Retrieve the review comments using `GET /tasks/:id/comments`.
       Identify reviewer comments that require a response.
    c. Address each comment -- make the required code changes.
    d. Run linting on files modified. Fix any lint errors in those
       files only.
    e. Run the tests for the current gate or stream. All tests must
       pass. Fix any failures caused by the changes.
    f. Reply to each reviewer comment using
       `POST /tasks/:id/comments` with `parent_id` set to the
       original comment's ID, explaining what was done.
       Example:
         curl -X POST http://127.0.0.1:7300/tasks/R6-3.0.1/comments \
           -H "Content-Type: application/json" \
           -d '{
             "severity": "MINOR",
             "body": "Added try/catch with specific error types in share.controller.ts -- handles 404, 403, and 500.",
             "author": "implementer",
             "parent_id": 42
           }'
    g. Move task to IN-REVIEW using `POST /tasks/:id/submit`.

    Repeat for the next task.

  STEP 4 -- COMMIT AND STOP
    When all addressed tasks are back in IN-REVIEW:
    - Commit per docs/core/git-execution-workflow.md CommitOnCompletion.
    - Report to the user which tasks were addressed.
    - Do NOT move any task to DONE.
    - Wait for the reviewer to re-review.

  HARD RULES:
  - The agent NEVER moves a task to DONE, even after addressing
    review notes. Only the reviewer does.
  - Tasks move IN-PROGRESS to IN-REVIEW, never IN-PROGRESS to DONE.
  - Tasks in REWORK move REWORK → IN-PROGRESS → IN-REVIEW.
  - The agent responds to every review comment. No comment is silently
    skipped or ignored.
  - If a review comment is unclear, ask the user for clarification
    before making changes.
  - Replies use `parent_id` to thread under the original reviewer
    comment, keeping the conversation traceable.
</ApplyReviewNotes>

---

<TrackerStates>
  The tracker uses these five states:

  TO-DO        -- Task exists but is not yet being worked on
  IN-PROGRESS  -- Task is actively being worked on by an agent
  IN-REVIEW    -- Task is complete and awaiting review
  REWORK       -- Task was rejected during review and needs correction
  DONE         -- Task has passed review (moved by reviewer only)

  STATE TRANSITIONS:

  During execution (StartGateOrStream):
    TO-DO → IN-PROGRESS → IN-REVIEW

  During review note application (ApplyReviewNotes):
    IN-REVIEW → IN-PROGRESS → IN-REVIEW
    REWORK → IN-PROGRESS → IN-REVIEW

  During review (handled by review.md):
    IN-REVIEW → DONE (if clean)
    IN-REVIEW → REWORK (if changes needed)

  FORBIDDEN TRANSITIONS:
  - Execution agent NEVER moves to DONE
  - No task skips IN-REVIEW
  - No task moves backward from DONE
  - No direct REWORK → DONE transition
</TrackerStates>

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

---

## Anti-Patterns

```xml
<AntiPatterns>
  <AntiPattern name="Direct Tracker Database Mutation">
    <BadExample>Opening docs/.blueprint/tasks.db with SQLite directly, running raw SQL queries to read or modify task state, or editing the database file with any tool other than the tracker HTTP API.</BadExample>
    <Why>The tracker HTTP API is the sole interface for reading and writing tracker state. Direct database access bypasses validation, triggers, and the snapshot engine, producing inconsistent state that the board UI and other agents cannot reconcile. Always use the HTTP recipes in docs/core/tracker.md (e.g., POST /tasks/:id/start, submit, resume, approve, reject for canonical state changes, PATCH /tasks/:id for non-canonical edits, GET /tasks for lookups).</Why>
  </AntiPattern>
</AntiPatterns>
```
