# Review

This module defines how code review is conducted on completed tasks.
A review examines work that has been moved to the IN-REVIEW state on
the kanban board and either approves it or leaves structured feedback.

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
  - Kanban MCP is reachable
  - User has specified which gate, stream, or agent's work to review

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
         Write "Clean -- no issues found" in the Review Notes
         section of the task description.
         Move task to DONE.

       IF issues found:
         Write detailed review notes in the Review Notes section
         of the task description per <ReviewNoteFormat>.
         Task stays in IN-REVIEW.

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
      (no tasks remain in IN-REVIEW with notes):
        Follow the MergeProcess in docs/core/git-review-workflow.md
        to merge the branch to main and clean up the worktree.

      IF any tasks still have review notes (not all clean):
        Do NOT merge. The branch stays as-is until the
        re-review cycle completes all tasks to DONE.

  STEP 5 -- REPORT
    After all tasks have been reviewed, report to the user:
    - Which tasks were marked clean and moved to DONE
    - Which tasks have review notes that need to be addressed
    - Whether all acceptance criteria for the gate/stream are met
    - Whether the branch was merged to main (or why not)
    - A brief summary of the most significant issues found
</ReviewProcess>

---

<ReReview>
  Review is a multi-turn process. A single pass rarely resolves
  all issues. The cycle repeats until every task is clean:

  1. Reviewer examines tasks, leaves notes on tasks with issues,
     moves clean tasks to DONE.
  2. Executing agent addresses notes via ApplyReviewNotes in
     execution.md. Tasks return to IN-REVIEW.
  3. Reviewer RE-REVIEWS the same tasks:
     - For each task, read the agent's responses to each note.
     - Verify the fix actually resolves the issue -- do not take
       the agent's word for it. Check the code.
     - If the fix is correct: mark the note as resolved.
     - If the fix is incomplete or introduces a new issue:
       leave a new note explaining what is still wrong.
     - If all notes on a task are resolved: write "Clean" and
       move to DONE.
     - If any notes remain unresolved or new issues are found:
       task stays in IN-REVIEW with updated notes.
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
  Review notes are written in the Review Notes section of the
  task description on the kanban board.

  Each issue is a separate bullet point with:
    - Severity: MAJOR or MINOR
    - Description of the issue
    - Explanation of what problem it causes or could cause

  MAJOR -- Must be fixed before the task can move to DONE.
    Incorrect logic, missing functionality, convention violations
    that affect maintainability, security concerns, broken patterns.

  MINOR -- Should be addressed but is not blocking.
    Style inconsistencies not caught by linting, minor naming
    improvements, small refactors that would improve clarity.

  FORMAT:
    Review Notes:
    - [MAJOR] {{Description of issue}}
      Why: {{What problem this causes or could cause}}
    - [MAJOR] {{Description of issue}}
      Why: {{What problem this causes or could cause}}
    - [MINOR] {{Description of issue}}
      Why: {{What problem this causes or could cause}}

  EXAMPLE:
    Review Notes:
    - [MAJOR] Share endpoint does not validate email format before
      sending the invite.
      Why: Invalid emails will pass through to the mail service,
      causing silent failures and confusing error states.
    - [MAJOR] Permission check in document routes uses string
      comparison instead of the enum defined in M2-4.0.1.
      Why: Bypasses the single source of truth for permission
      levels, making future changes error-prone.
    - [MINOR] Variable name `perm` in sharing service -- use
      `permissionLevel` for consistency with conventions.md.
      Why: Abbreviations reduce readability across the codebase.

  When a task is clean:
    Review Notes:
    Clean -- no issues found.
</ReviewNoteFormat>

---

<ReviewScope>
  RULES:
  - The reviewer only reviews tasks in the IN-REVIEW state.
  - The reviewer only reviews tasks belonging to the specified
    gate, stream, or agent -- not other streams.
  - The reviewer ONLY moves tasks to DONE when they are clean.
    Tasks with any issues -- MAJOR or MINOR -- stay in IN-REVIEW.
  - The reviewer does not fix code. It identifies issues and
    documents them. The executing agent addresses them via
    the ApplyReviewNotes flow in execution.md.
</ReviewScope>
