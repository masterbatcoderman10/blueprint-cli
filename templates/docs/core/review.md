# Review

This module defines how code review is conducted on completed tasks.
A review examines work that has been moved to the IN-REVIEW state on
the tracker and either approves it or leaves structured feedback.

---

<ReviewProcess>
  PURPOSE: Verify that completed tasks meet requirements, follow
  project conventions, and are free of anti-patterns.

  Triggered by user command:
    - "Review stream A" or "Review gate 4.0"
    - "Review the tasks performed by [agent name]"

  PRECONDITIONS:
  - Phase document is loaded (including its Test Plan section)
  - docs/conventions.md is loaded (tech stack, coding standards, patterns)
  - docs/core/tracker.md is loaded (state machine, API recipes)
  - Local tracker server is reachable
  - User has specified which gate, stream, or agent's work to review

  NOTE ON TWEAK REVIEW:
    Tweak documents (`docs/tweaks/tweak-<n>-<slug>.md`) are valid
    review sources alongside phase documents. When reviewing a tweak,
    the reviewer follows the same ReviewProcess flow, with the
    tweak-completion gate in mind: the terminal tweak task may only
    move to DONE when the full project test suite (`npm test`) is green.

  CONTEXT INFERENCE:
    The current milestone and phase are read from
    docs/project-progress.md. When the user says "review stream A"
    or "review gate", infer the milestone and phase from
    project-progress.md. Do NOT ask the user which milestone
    or phase they mean unless project-progress.md is ambiguous
    or does not reference an active phase.

  FLOW:

  STEP 1 -- IDENTIFY TASKS AND WORKTREE
    Retrieve all tasks for the specified gate or stream (or by the
    specified agent) that are in the IN-REVIEW state.
    Use `GET /tasks?phase=<phase>&stream=<stream>` as documented
    in `docs/core/tracker.md`.

    IF no tasks are in IN-REVIEW:
      Inform user: "No tasks found in review."
      STOP.

    IF reviewing bug fix tasks ([BUG] prefix):
      Bug fixes work on main. No worktree verification needed.
      Review the code on main directly.

    IF reviewing gate or stream tasks:
      Load docs/core/git-review-workflow.md. Follow its
      WorktreeVerification process to confirm the worktree exists
      and navigate into it. All code examination happens inside
      the worktree directory.

  STEP 2 -- REVIEW EACH TASK (sequentially)
    For each task in IN-REVIEW:

    a. Read the task description -- understand what it was supposed
       to deliver (reference the phase document for requirements).
    b. Read the implementation notes left by the executing agent.
    c. Examine the code changes -- files modified, logic added,
       patterns used.
    d. Evaluate against <ReviewCriteria>.
    e. Determine outcome:

       IF no issues found:
         Approve the task using `POST /tasks/:id/approve`.
         This transitions the task from IN-REVIEW to DONE.
         ```bash
         curl -X POST http://127.0.0.1:7300/tasks/<id>/approve \
           -H "Content-Type: application/json"
         ```
         You may also attach optional review comments atomically
         with the approval by supplying a `comments` array.

         Single MAJOR note (acknowledged, non-blocking):
         ```bash
         curl -X POST http://127.0.0.1:7300/tasks/<id>/approve \
           -H "Content-Type: application/json" \
           -d '{
             "comments": [
               { "severity": "MAJOR", "body": "Clean overall. Note: error path in helper skips logging -- acceptable for now but worth revisiting before next release.", "author": "reviewer" }
             ]
           }'
         ```

         Batch with reply (parent_id threads a note under a prior comment):
         ```bash
         curl -X POST http://127.0.0.1:7300/tasks/<id>/approve \
           -H "Content-Type: application/json" \
           -d '{
             "comments": [
               { "severity": "MINOR", "body": "Clean -- no issues found.", "author": "reviewer" },
               { "severity": "MINOR", "body": "Consider renaming the helper for clarity in a follow-up.", "author": "reviewer", "parent_id": <prior-comment-id> }
             ]
           }'
         ```

       IF issues found:
         Reject the task using `POST /tasks/:id/reject`. Rejection
         requires at least one comment (`comments` array with ≥1
         entry). An empty or missing array returns `400` and leaves
         the task state unchanged.
         ```bash
         curl -X POST http://127.0.0.1:7300/tasks/<id>/reject \
           -H "Content-Type: application/json" \
           -d '{
             "comments": [
               {
                 "severity": "MAJOR",
                 "body": "Share endpoint does not validate email format before sending the invite.\nWhy: Invalid emails will pass through to the mail service, causing silent failures and confusing error states.",
                 "author": "reviewer"
               },
               {
                 "severity": "MINOR",
                 "body": "The variable name `x` is not descriptive. Consider `recipientEmail`.",
                 "author": "reviewer"
               },
               {
                 "severity": "MINOR",
                 "body": "Missing JSDoc on the public `share` function.",
                 "author": "reviewer"
               }
             ]
           }'
         ```
         All comments in the array are inserted atomically with the
         state change. If any comment fails validation, the entire
         transaction rolls back and the task remains in IN-REVIEW.

         Also leave a summary comment with the canonical
         transition note:
           "Task moved to REWORK. After corrections, the agent must
            follow the canonical REWORK → IN-PROGRESS → IN-REVIEW
            transition per docs/core/tracker.md before this task
            can reach DONE."

    Repeat for the next task.

  STEP 3 -- VERIFY ACCEPTANCE CRITERIA
    After all individual tasks have been reviewed, verify the
    gate or stream acceptance criteria from the phase document
    are collectively satisfied.

    Individual tasks may each be clean, but the gate or stream
    as a whole may still fail an acceptance criterion if tasks
    do not integrate correctly.

    IF any acceptance criterion is not satisfied:
      Identify which criterion fails and which tasks contribute
      to the gap.
      Report to user. The user decides resolution -- add a task,
      rework an existing one, or adjust the criterion.

    IF all acceptance criteria are satisfied:
      Continue to STEP 4.

  STEP 4 -- MERGE (only if all tasks are clean)
    IF reviewing bug fix tasks:
      No merge needed -- bug fixes are already on main.
      Skip to STEP 5.

    IF reviewing gate or stream tasks:
      IF every task in the gate or stream was moved to DONE
      (no tasks remain in IN-REVIEW or REWORK):
        Follow the MergeProcess in docs/core/git-review-workflow.md
        to merge the branch to main and clean up the worktree.

      IF any tasks are in REWORK:
        Do NOT merge. The branch stays as-is until the
        re-review cycle completes all tasks to DONE.

  STEP 5 -- REPORT
    After all tasks have been reviewed, report to the user:
    - Which tasks were marked clean and moved to DONE
    - Which tasks were moved to REWORK and need to be addressed
    - Whether all acceptance criteria for the gate/stream are met
    - Whether the branch was merged to main (or why not)
    - A brief summary of the most significant issues found
</ReviewProcess>

---

<ReReview>
  Review is a multi-turn process. A single pass rarely resolves
  all issues. The cycle repeats until every task is clean:

  1. Reviewer examines tasks, leaves feedback as tracker comments
     on tasks with issues, moves clean tasks to DONE. Tasks with
     issues are moved to REWORK.
  2. Executing agent addresses notes via ApplyReviewNotes in
     execution.md. The agent replies to each reviewer comment
     using `POST /tasks/:id/comments` with `parent_id` set to
     the original comment's ID. Tasks in REWORK move to
     IN-PROGRESS, then back to IN-REVIEW following the canonical
     transition REWORK → IN-PROGRESS → IN-REVIEW.
  3. Reviewer RE-REVIEWS the same tasks:
     - For each task, read the agent's reply comments (use
       `GET /tasks/:id/comments` to list all comments and replies).
     - Verify the fix actually resolves the issue -- do not take
       the agent's word for it. Check the code.
     - If the fix is correct: mark the reply comment as resolved
       by leaving a follow-up comment acknowledging resolution.
     - If the fix is incomplete or introduces a new issue:
       leave a new comment explaining what is still wrong.
     - If all comments on a task are resolved: approve the task
       using `POST /tasks/:id/approve` and leave a "Clean" comment.
     - If any comments remain unresolved or new issues are found:
       reject the task using `POST /tasks/:id/reject` with at least
       one comment explaining what is still wrong.
  4. Repeat from step 2 until all tasks are in DONE.

  There is no limit to the number of review rounds. The cycle
  continues as long as issues exist. This is not a rubber stamp --
  each re-review is as thorough as the first.

  After each re-review round, verify the gate or stream
  acceptance criteria are still collectively satisfied per
  STEP 3 of the ReviewProcess.

  The branch merge (STEP 4 of ReviewProcess) only occurs on the
  final pass -- when every task in the gate or stream is in DONE.
  Until then, the worktree and branch remain as-is.
</ReReview>

---

<ReviewCriteria>
  The reviewer checks each task against the following areas.
  These are not a mechanical checklist -- they require judgement
  based on the project's stack, conventions, and context.

  FUNCTIONALITY
    - Does the code deliver what the task requires?
    - Do the acceptance criteria from the phase document pass?
    - Are edge cases handled appropriately?

  CONVENTIONS
    - Does the code follow the patterns defined in conventions.md?
    - Are naming conventions, file organization, and code style
      consistent with the rest of the project?

  LOGIC AND STRUCTURE
    - Is the logic correct and easy to follow?
    - Is the code overcomplicated? Could it be simpler without
      losing functionality?
    - Are responsibilities properly separated?
    - Are there unnecessary abstractions or premature optimizations?

  ANTI-PATTERNS
    - Are there known anti-patterns for the project's stack?
    - Are there general software engineering anti-patterns?
      (e.g., god functions, deeply nested logic, silent error
      swallowing, hardcoded values that should be configurable)

  STANDARDS AND LIBRARY USAGE
    - Are libraries used correctly and idiomatically?
    - Is the code using current, non-deprecated APIs?
    - Are there better standard approaches for what the code
      is trying to do?

  TESTING
    - Reference the Test Plan section of the phase document.
    - For each task in the stream being reviewed, check:
      - If the task is marked testable: do the mapped tests exist
        in the codebase and do they pass?
      - If the task is marked not testable: confirm no tests were
        expected.
      - If the task is marked partially testable: do the tests for
        the testable parts exist and pass?
    - Were tests written before implementation (TDD)? Check git
      history or task notes for evidence. If tests were clearly
      written after the fact, flag as a MINOR issue.
    - Do the tests actually verify meaningful behavior, or are
      they superficial (e.g., only checking that a function exists
      without testing its logic)?

  The reviewer runs ONLY the tests for the stream being reviewed,
  not the full test suite. Full suite validation is the phase
  completion agent's responsibility.

  This goes beyond linting. Linting catches syntax and formatting.
  Review catches logic, structure, conventions, testing, and design.
</ReviewCriteria>

---

<ReviewNoteFormat>
  Review feedback is left as tracker comments using the
  `POST /tasks/:id/comments` endpoint documented in
  `docs/core/tracker.md`.

  Each issue is a separate comment with:
    - Severity: MAJOR or MINOR (set via the `severity` field)
    - Body: Description of the issue and explanation of what
      problem it causes or could cause (set via the `body` field)
    - Author: Name of the reviewer (set via the `author` field)

  MAJOR -- Must be fixed before the task can move to DONE.
    Incorrect logic, missing functionality, convention violations
    that affect maintainability, security concerns, broken patterns.

  MINOR -- Should be addressed but is not blocking.
    Style inconsistencies not caught by linting, minor naming
    improvements, small refactors that would improve clarity.

  BODY FORMAT for each comment:
    {{Description of issue}}
    Why: {{What problem this causes or could cause}}

  EXAMPLE (creating a MAJOR comment via the API):
    curl -X POST http://127.0.0.1:7300/tasks/M2-4.A.1/comments \
      -H "Content-Type: application/json" \
      -d '{
        "severity": "MAJOR",
        "body": "Share endpoint does not validate email format before sending the invite.\nWhy: Invalid emails will pass through to the mail service, causing silent failures and confusing error states.",
        "author": "reviewer"
      }'

  When a task is clean:
    curl -X POST http://127.0.0.1:7300/tasks/M2-4.A.1/comments \
      -H "Content-Type: application/json" \
      -d '{
        "severity": "MAJOR",
        "body": "Clean -- no issues found.",
        "author": "reviewer"
      }'
</ReviewNoteFormat>

---

<ReviewScope>
  RULES:
  - The reviewer only reviews tasks in the IN-REVIEW state.
  - The reviewer only reviews tasks belonging to the specified
    gate, stream, or agent -- not other streams.
  - The reviewer ONLY moves tasks to DONE when they are clean.
    Tasks with any issues -- MAJOR or MINOR -- are moved to REWORK.
  - The reviewer does not fix code. It identifies issues and
    documents them. The executing agent addresses them via
    the ApplyReviewNotes flow in execution.md.
</ReviewScope>

---

## Anti-Patterns

```xml
<AntiPatterns>
  <AntiPattern name="Direct Tracker Database Mutation">
    <BadExample>Opening docs/.blueprint/tasks.db with SQLite directly, running raw SQL queries to read or modify task state, or editing the database file with any tool other than the tracker HTTP API.</BadExample>
    <Why>The tracker HTTP API is the sole interface for reading and writing tracker state. Direct database access bypasses validation, triggers, and the snapshot engine, producing inconsistent state that the board UI and other agents cannot reconcile. Always use the HTTP recipes in docs/core/tracker.md (e.g., POST /tasks/:id/approve or reject for reviewer state changes, POST /tasks/:id/start, submit, resume for implementer state changes, POST /tasks/:id/comments for standalone review feedback).</Why>
  </AntiPattern>
</AntiPatterns>
```
