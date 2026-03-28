# Alignment

This module bootstraps a new Blueprint project by analyzing what exists
and producing the foundational documents. It runs when project-progress.md
is empty — meaning Blueprint has been scaffolded but no planning has
been done yet.

---

<AlignmentFlow>
  PURPOSE: Assess the current state of the project, confirm findings with
  the user, and produce the initial planning documents.

  STEP 1 — ASSESS WHAT EXISTS
    Run a scan of the project to determine what is available:

    CHECK — Does docs/knowledge-base/ exist and contain documents?
    CHECK — Does a codebase exist outside of docs/?
    CHECK — Does a git history exist?

    Based on findings, classify:

    IF knowledge-base/ has documents AND codebase exists:
      → STATE = EXISTING_WITH_DOCS
      → Analyze both knowledge-base docs and codebase.

    IF no knowledge-base/ BUT codebase exists:
      → STATE = EXISTING_NO_DOCS
      → Analyze codebase and git history only.

    IF no knowledge-base/ AND no codebase:
      → STATE = EMPTY
      → Skip to <KanbanSetup>, then proceed to <DocumentProduction>.
        EMPTY projects follow the same 5+1 document sequence as
        existing projects. There are no SRS population leads from
        analysis — the SRS Q&A probes features from the user
        independently. Do NOT dispatch directly to full prd-planning.md.

  STEP 2 — ANALYZE (only for EXISTING_WITH_DOCS and EXISTING_NO_DOCS)

    FOR ARCHIVED DOCS (if present):
      - Read all documents in docs/knowledge-base/
      - Identify: product description, listed features, planned features,
        user types, technical decisions, any existing milestones or roadmap
      - Note which features appear to be planned vs implemented
      - Check for agent instruction files (e.g., AGENTS.md, claude.md,
        .cursorrules, copilot-instructions.md, or similar). These may
        contain coding conventions, tool preferences, style rules, or
        workflow instructions from a previous setup. Extract any
        conventions relevant to how the code should be written —
        these belong in conventions.md.
        IF any instructions in these files conflict with Blueprint's
        own protocols (e.g., different task management rules, different
        review processes, different file organization):
          → Flag the conflict to the user. Explain what Blueprint does
            and what the existing instruction says.
          → Let the user decide which convention to keep.
          → Do not silently override pre-existing conventions, and do
            not silently let them override Blueprint.

    FOR CODEBASE:
      - Scan project structure — directories, entry points, config files
      - Identify tech stack: language, framework, database, notable libraries
      - Identify file organization patterns and conventions
      - Check for test infrastructure: test runner config files
        (jest.config, vitest.config, pytest.ini, etc.), test directories,
        existing test files, test scripts in package.json or equivalent.

    FOR GIT HISTORY (if git is initialized and has commits):
      - Analyze the commit history to understand the development
        timeline. Review commit messages, file changes, and the
        progression of features over time.
      - Derive a concise summary of what was built and in what
        order — group related commits into logical phases of work
        (e.g., "initial setup", "auth system", "API endpoints",
        "frontend components").
      - This becomes the basis for retroactive milestone and phase
        documents. The goal is a clear picture of "what exists and
        how it got here", not a commit-by-commit log.
      - Keep this concise. A project with 200 commits does not
        need 200 lines of analysis — it needs 5-10 logical groups
        that describe the major development arcs.

    FOR FEATURE STATUS:
      - Cross-reference documented features (from knowledge-base docs) with
        the codebase to determine:
        - Features that are implemented and working
        - Features that are partially implemented
        - Features that are documented but not yet built
      - If no knowledge-base docs exist, derive the feature list from
        what the codebase already does

    SRS POPULATION LEADS:
      After completing the analysis above, extract and structure a list
      of named feature leads from all sources. These are the starting
      context for SRS Q&A — they are NOT requirements themselves.

      FOR EACH FEATURE identified from any source (knowledge base,
      codebase, git history, or feature status cross-reference):
        - Assign a short descriptive name (e.g., "Manual recipe saving",
          "URL recipe import", "Recipe search")
        - Write a one-sentence description of what the feature does
          from the user's perspective
        - Note the source: knowledge base, codebase, git history,
          or user input
        - Note the observed status: implemented, partially implemented,
          planned but not built, or inferred from code

      STRUCTURE:
        Feature leads should be presented as a flat list:
          - **{{Feature Name}}** — {{One-sentence description}}
            Source: {{where discovered}}  Status: {{observed status}}

      PURPOSE:
        These leads seed the SRS questioning cycle in srs-planning.md.
        The SRS process uses them as conversation starters — probing
        the user for requirements that may not be visible in the code
        or docs. The leads are NOT copied verbatim into the SRS.
        The SRS Q&A may discover additional requirements beyond what
        the leads suggest, and may refine or discard leads that do
        not represent real requirements.

  STEP 3 — CONFIRM WITH USER
    Present findings to the user in a structured summary:

    - "Here is what I found in the project:"
      - Tech stack and key libraries
      - File organization pattern
      - Features that appear to be implemented
      - Features that appear to be planned but not built
      - Any architectural decisions or patterns observed
      - Test infrastructure: framework and runner if found,
        or "no test infrastructure detected"
      - Conventions from agent instruction files (if found)
      - Development timeline derived from git history (if present):
        major phases of work identified from commits
      - SRS population leads: the named feature leads extracted
        during analysis, presented so the user can confirm, correct,
        or add missing features before SRS Q&A begins

    Then ASK — do not just wait for a nod. Actively question:
      - "Are there features or capabilities I missed?"
      - "Is anything I listed inaccurate or outdated?"
      - "Are there architectural decisions or constraints
        that aren't visible in the code or docs?"
      - Any specific ambiguities encountered during analysis
        (e.g., "I found two different auth patterns — which
        is the current approach?")

    This is a conversation, not a report. The knowledge base
    and codebase may be incomplete. The user knows things that
    the documents do not capture. Ask in small chunks — 2-3
    questions at a time, not everything at once. Let each
    answer guide the next round. Ask until there are no open
    questions on either side.

    Do NOT proceed to document creation until the user confirms
    the summary is accurate.

  STEP 4 — KANBAN SETUP
    → GOTO <KanbanSetup>

  STEP 5 — PRODUCE DOCUMENTS
    → GOTO <DocumentProduction>
</AlignmentFlow>

---

<KanbanSetup>
  A vibe-kanban project is required for task management in Blueprint.

  CHECK — Does a vibe-kanban project exist for this project?

  IF the kanban MCP is not connected:
    Inform user: "Blueprint uses vibe-kanban MCP for task management.
    Please connect the vibe-kanban MCP tool before proceeding with
    task execution. You can continue with planning without it, but
    task work will be blocked until it is available."

  IF the kanban MCP is connected but no project exists:
    Ask user for the kanban project name to create.

  IF the kanban MCP is connected and a project exists:
    Confirm the project name with the user.

  Record the kanban project name (or "TBD" if not yet set up)
  for inclusion in project-progress.md.
</KanbanSetup>

---

<DocumentProduction>
  Alignment produces five documents and populates a sixth.
  Each document is created using its respective planning module.

  CRITICAL RULE — ONE DOCUMENT AT A TIME
    Planning documents are created sequentially, one at a time.
    Each document must be drafted, reviewed with the user, and
    confirmed before the next document begins.

    Do NOT batch-generate multiple planning documents in a single
    response. Each document may surface questions, missing features,
    or corrections that affect subsequent documents. Rushing ahead
    without confirmation produces documents the user has not
    validated.

    The sequence is: draft → present to user → incorporate feedback
    → user confirms → move to the next document.

  ORDER OF CREATION:

  1. docs/conventions.md
     - IF codebase exists: populate from analysis — tech stack, language,
       framework, database, notable libraries, file organization,
       coding patterns observed in the codebase
     - IF no codebase (STATE = EMPTY): ask the user for their intended
       tech stack and preferences, then populate
     - IF agent instruction files were found in knowledge-base (e.g.,
       claude.md, .cursorrules): incorporate their coding conventions,
       style rules, and tool preferences into the appropriate sections.
       These are the user's established preferences and should be
       preserved unless they conflict with Blueprint protocols.
     - Confirm contents with user before finalizing.
       Do NOT write conventions.md without explicit user approval.
       The user may have preferences, corrections, or additions
       that the codebase analysis cannot reveal.

     STRUCTURE (sections in order):
       ## Tech Stack
         Language, framework, database, key runtime dependencies.
       ## Libraries & Tools
         Notable libraries, build tools, package managers, linters,
         formatters, and their versions if pinned.
       ## File Structure
         How the project organizes its source code. Describe the
         directory layout pattern (e.g., feature-based, layer-based)
         and where key file types live.
       ## Coding Standards
         Naming conventions, formatting rules, import ordering,
         and any project-specific patterns the codebase follows.
       ## Testing
         Testing framework, test runner command, test file location
         and naming conventions (e.g., *.test.ts co-located with
         source, or tests/ directory with mirrored structure).
         This section is REQUIRED. test-planning.md, execution,
         review, and phase completion all depend on it.
       ## Anti-Patterns
         Patterns to avoid in this project. Include both general
         anti-patterns and stack-specific ones observed or mandated.
       ## Agent Tools
         MCP servers, skills, or external tools agents should use
         during execution. Include connection details or references
         where applicable.
       ## Project-Specific Notes
         Anything that does not fit above — deployment constraints,
         environment variables, authentication patterns, third-party
         integration notes, or user-specified conventions.

     Not all sections need content on day one. Populate what is
     known; leave others as placeholders for later refinement.
     The Testing section must always be populated — at minimum
     a chosen framework, test runner command, and file conventions.

     TESTING FRAMEWORK SELECTION:
       The agent SHOULD suggest a testing framework based on the
       tech stack rather than asking the user to choose from scratch.
       Well-established defaults exist for most stacks. Suggest the
       standard choice and let the user override if they prefer
       something different.

       IF STATE = EMPTY (new project):
         Suggest the standard testing framework for the chosen stack.
         Record the user's choice (or the default if they accept).

       IF STATE = EXISTING_WITH_DOCS or EXISTING_NO_DOCS:
         IF test infrastructure exists (detected in STEP 2):
           Document what exists — framework, runner, file patterns.
         IF no test infrastructure exists:
           Suggest a framework based on the detected tech stack.
           Record the chosen framework and note that infrastructure
           setup is pending. This becomes a gate task in the first
           phase.
           Testing is FORWARD-ONLY. Tests cover new work from this
           point forward. Do not retroactively write tests for
           existing untested code — that would block all forward
           progress. Existing code gets tested only when it is
           modified as part of new work, bug fixes, or revisions.

  2. docs/prd.md — Stage 1 (body only)
     - Load docs/core/prd-planning.md. Follow its Stage 1 process.
     - Stage 1 produces ONLY the PRD body: Overview, Target Users,
       and Platform & Experience. No milestones are written yet.
     - IF features were identified during analysis, use them as
       context for the PRD conversation — but still confirm and
       refine with the user
     - IF STATE = EMPTY, start from scratch with the user
     - Do NOT proceed to milestones. The PRD body must be confirmed
       before SRS creation begins.

  3. docs/srs.md
     - Load docs/core/srs-planning.md. Follow its process.
     - The SRS has its own questioning cycle. It does NOT distill
       requirements from the PRD body. The PRD body provides product
       context, but requirements are probed from the user directly.
     - Use the SRS population leads from STEP 2 as conversation
       starters. These are the named features extracted during
       analysis — they seed the Q&A but do not define the SRS.
     - The Q&A may discover requirements beyond the leads and may
       refine or discard leads that do not represent real requirements.
     - The SRS must contain at least one requirement with a stable ID
       before proceeding to the next step.

  4. docs/prd.md — Stage 2 (add milestones)
     - Load docs/core/prd-planning.md. Follow its Stage 2 process.
     - Stage 2 adds the Milestones section to the existing PRD body.
     - Group SRS requirements into milestones. Each milestone title
       is followed by a "Relevant requirements:" line listing the
       SRS IDs that the milestone addresses.
     - Implemented features and planned features should be organized
       into milestones per prd-planning.md conventions.

  5. First milestone document
     - Load docs/core/planning.md, then docs/core/milestone-planning.md.
       Follow their process.
     - IF git history analysis produced a development timeline:
       Use it as the basis for structuring what has already been
       built. The logical groups from the git analysis map to
       phases within the milestone. This gives the milestone
       document an accurate picture of completed work without
       requiring the user to reconstruct it from memory.
     - The first milestone typically covers what has already been built
       plus the immediate next increment
     - If significant work is already implemented, the first milestone
       may be partially or fully complete — reflect this in the document
     - After establishing what exists, ask the user about what
       comes next — the future direction, upcoming features, and
       priorities. The git history tells you where the project has
       been; the user tells you where it is going.

  6. docs/project-progress.md
     - Populate using the following template:

       # Project Progress

       **Project**: {{PROJECT_NAME}}
       **Kanban**: {{KANBAN_PROJECT_NAME or "TBD"}}
       **Current Milestone**: {{MILESTONE_NUMBER}} — {{MILESTONE_NAME}}
       **Current Phase**: Phase {{PHASE_NUMBER}} — {{PHASE_NAME}}
       **Status**: {{Planning | In Progress | Complete}}

       ---

       ## Decisions

       > Append entries as decisions are made. Never delete. Oldest at top.

       - {{YYYY-MM-DD}}: {{Decision made and rationale}}

       ---

       ## Milestone Overview

       | Milestone | Name | Status |
       |-----------|------|--------|
       | M1 | {{Name}} | {{Not Started | In Progress | Complete}} |

       > Add rows as milestones are defined.

       ---

       ## Phase Graph

       > Visual history of all phases. Updated by the phase completion
       > agent. Use ✓ for complete, ● for in progress, ○ for not started.

       ```
       M1 — {{Milestone Name}}
       └── Phase 1 — {{Name}} ○
       ```

       > Extend as phases and milestones are added:
       > M1 — Recipe Collection
       > ├── Phase 1 — Data Foundation ✓
       > ├── Phase 2 — Real-Time Editing ✓
       > ├── Phase 3 — Presence & Awareness ●
       > └── Phase 4 — Permissions & Sharing ○
       > M2 — Collaborative Editing
       > └── Phase 1 — Sync Infrastructure ○

       ---

       ## Pending Revisions

       > Track revisions that have been identified but not yet executed.
       > The agent should surface these at session start.

       (none)

     - Fill in project name, kanban project name (or "TBD"),
       current milestone reference, and set current phase to
       "TBD — pending phase planning" unless a phase is obvious
     - This makes the project ACTIVE for future sessions
</DocumentProduction>
