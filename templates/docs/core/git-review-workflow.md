# Git Review Workflow

This module defines how the review agent uses Git during code review.
It covers worktree verification, navigating into the correct working
directory, merging to main after a clean review, conflict handling,
and worktree cleanup.

Loaded by review.md at the start of ReviewProcess.

---

<WorktreeVerification>
  PURPOSE: Confirm the target worktree exists and navigate into it
  before any code examination begins.

  STEP 1 — LIST WORKTREES
    Run: git worktree list
    Identify the worktree for the gate or stream being reviewed.

    Worktree name format:
      Gate:   M<milestone>-P<phase>-0
      Stream: M<milestone>-P<phase>-<stream letter>

  STEP 2 — VERIFY
    IF the worktree exists:
      Navigate to worktrees/<n>/
      All code examination happens inside this directory.

    IF the worktree does not exist:
      STOP. Inform user: "Worktree for <gate/stream> not found.
      Cannot review without the working directory."
</WorktreeVerification>

---

<MergeProcess>
  PURPOSE: Merge the gate or stream branch to main after all
  tasks in the gate or stream are clean and moved to DONE.

  PRECONDITION: Every task in the gate or stream is in DONE.
  This means the review is fully complete — no tasks remain
  in IN-REVIEW with notes.

  IF any tasks still have review notes:
    → Do NOT merge. The branch stays as-is until the re-review
      cycle completes all tasks to DONE.
    → The merge only happens on the final clean pass.

  MERGE STEPS:
    1. Navigate to the main working directory (not the worktree).
    2. git checkout main
    3. git merge <branch name>
    4. IF merge succeeds cleanly:
         → Run git diff to confirm the merge contains the
           expected changes. This is a sanity check, not a
           full test run.
         → Continue to cleanup.
       IF merge has conflicts:
         → Do NOT force the merge.
         → Report conflicts to the user with the affected files.
         → The user decides resolution. This should be rare
           if stream file isolation is respected, but it can
           happen when integration points overlap.
         → Do NOT proceed to cleanup until conflicts are resolved.
</MergeProcess>

---

<WorktreeCleanup>
  After a successful merge, immediately remove the worktree
  and delete the branch. Do not ask the user for confirmation.
  This is automatic cleanup, not a decision point.

    git worktree remove worktrees/<n>
    git branch -d <branch name>

  IF the merge had conflicts that were resolved:
    Clean up only after confirming the resolution is complete
    and the merge is on main.
</WorktreeCleanup>

---

<MergePoints>
  A merge point occurs whenever a gate or stream's successful
  review triggers a merge to main. This is significant because
  dependent streams branch from main — they need the merged
  work of their dependencies to be present.

  HOW MERGE POINTS ARISE:
    If the phase dependency graph is:

      Gate → A (parallel with B)
      Gate → B (parallel with A)
      A → C
      A + B → D

    The merge sequence is:
      1. Gate merges to main after gate review passes.
      2. A and B create worktrees from main (which includes gate).
      3. A and B execute and review in parallel.
      4. When A's review passes → A merges to main.
         C can now create its worktree from main (gate + A).
      5. When B's review passes → B merges to main.
         D can now create its worktree from main (gate + A + B).

    Each merge to main is a merge point. Dependent streams
    verify their dependencies are merged before creating
    their worktree — this is handled by git-execution-workflow.md.

  PHASE PLANNING INTEGRATION:
    The phase document's dependency graph and parallelization
    map implicitly define merge points. Every dependency arrow
    between streams implies: "the source stream must be merged
    to main before the target stream can start."

    Phase planning does not need a separate merge point section.
    The existing dependency notation is sufficient — the git
    workflow interprets dependencies as merge requirements.
</MergePoints>

---

<GitReviewRules>
  RULES:
  - The reviewer always verifies the worktree exists before
    reviewing. No worktree, no review.
  - All code examination happens inside the worktree directory.
  - The reviewer merges to main ONLY when every task in the
    gate or stream is in DONE. Partial merges are not allowed.
  - Merge conflicts are flagged to the user, never force-resolved.
  - Worktrees are cleaned up after a successful merge.
  - The merge is part of the review completion step — it is not
    a separate workflow triggered by the user.
</GitReviewRules>
