# Git Workflow

This module defines how git operations are performed in Blueprint projects.
It standardizes branch usage, commit quality checks, message format, and
safe push behavior.

---

<GitWorkflowProcess>
  PURPOSE: Ensure commits are intentional, traceable, and safe.

  Triggered by user requests such as:
    - "Commit this work"
    - "Set up this repo"
    - "Push this branch"
    - "Show git status"

  PRECONDITIONS:
  - Relevant planning docs are updated for the work being committed
    (phase/milestone/project-progress when applicable)
  - The working tree is understood (no unknown file changes)

  STEP 1 — CHECK REPOSITORY STATE
    - Inspect branch, status, and remotes
    - Identify whether this is:
      a) initial repository setup, or
      b) regular feature/change work

  STEP 2 — BRANCH STRATEGY
    - Initial repository setup may commit directly to `main`
    - All subsequent implementation work should use a short-lived branch:
      `codex/<short-topic>`
    - Do not change branches or create branches unless required by scope

  STEP 3 — VALIDATE SCOPE
    - Review changed files before staging
    - Stage only files relevant to the requested work
    - If unrelated changes are present, stop and ask the user how to handle them

  STEP 4 — QUALITY GATE
    - Run relevant checks before commit when possible:
      - tests related to changed behavior
      - lint/format checks if configured
    - If checks cannot run, state what was skipped and why in the report

  STEP 5 — COMMIT
    Use conventional commit style:
      `<type>(<scope>): <summary>`

    Allowed types:
      - feat: user-visible capability
      - fix: bug fix
      - chore: tooling/repo maintenance
      - docs: documentation-only changes
      - refactor: code restructure without behavior change
      - test: tests only

    Rules:
      - Subject line in imperative mood
      - Keep subject concise
      - One commit should represent one logical unit of change

  STEP 6 — PUSH (ONLY IF REQUESTED)
    - Push current branch to configured remote
    - Do not force push unless explicitly requested by user
    - Report remote branch and tracking status after push

  STEP 7 — REPORT
    Return:
      - branch name
      - commit hash and message
      - files included
      - checks run (or skipped)
</GitWorkflowProcess>

---

<SafetyRules>
  - Never run destructive git commands (e.g., reset --hard) without explicit user approval.
  - Never rewrite published history unless the user explicitly asks.
  - Never commit secrets or environment files.
  - Never include unrelated changes in a commit without user confirmation.
</SafetyRules>

---

<FailureHandling>
  IF git is blocked (e.g., lock file, conflicts, missing remote):
    - Inform the user of the exact blocker
    - Propose the minimum safe recovery step
    - Do not proceed until state is safe
</FailureHandling>
