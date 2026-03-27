# Blueprint Structure

This document defines the canonical folder layout for any project using Blueprint.
It is the source of truth for where files live, what is required, and what is prohibited.

---

## Directory Layout

```
AGENTS.md                                    # Repo root — entry point for all agents
docs/
├── project-progress.md                      # Project state: milestone, phase, kanban name
├── prd.md                                   # Full product requirements document
├── conventions.md                           # Tech stack, coding standards, project conventions
├── srs.md                                   # Software Requirements Specification
├── core/                                    # Protocol and reference modules (read-only during execution)
│   ├── blueprint-structure.md               # This file — defines the layout
│   ├── health-check.md                      # Session startup validation
│   ├── alignment.md                         # Analyze existing code/docs for Blueprint adoption
│   ├── prd-planning.md                      # How to author a PRD
│   ├── planning.md                          # Planning philosophy and orchestration
│   ├── milestone-planning.md                # How to plan a milestone (includes template)
│   ├── phase-planning.md                    # How to plan a phase (includes template and task conventions)
│   ├── srs-planning.md                      # How to define and evolve the SRS
│   ├── execution.md                         # Task creation, execution, and review note handling
│   ├── hierarchy.md                         # Five-level hierarchy reference
│   ├── review.md                            # Code review protocol
│   ├── test-planning.md                     # Test plan creation for phases (TDD specs)
│   ├── phase-completion.md                  # Phase verification, regression testing, state update
│   ├── scope-change.md                      # Handle new features during active work
│   ├── revision-planning.md                 # Impact analysis and planning for revisions
│   ├── bug-resolution.md                    # Bug diagnosis, reproduction, and fix routing
│   ├── git-execution-workflow.md            # Worktree setup and rules for executing agents
│   └── git-review-workflow.md               # Worktree verification, merge, and cleanup for reviewers
├── milestones/                              # One subfolder per milestone
│   ├── milestone-<n>-<n>/
│   │   ├── milestone-<n>-<n>.md          # Milestone definition (tracks, scope, order)
│   │   └── phase-<n>-<n>.md              # Phase plans belonging to this milestone
│   └── revision-<n>-<n>/
│       ├── revision-<n>-<n>.md              # Revision definition (impact, scope, phases)
│       └── phase-<n>-<n>.md                # Phase plans belonging to this revision
├── external/                                # Context from linked projects
│   └── <alias>/                             # One subfolder per linked project
│       ├── prd.md                           # Linked project's product requirements
│       ├── project-progress.md              # Linked project's current state
│       └── milestone-<n>-<name>.md          # Linked project's active milestone
└── knowledge-base/                                 # Pre-Blueprint docs preserved for reference
```

---

## Rules

### docs/ Root

- ONLY four files live at docs/ root: `project-progress.md`, `prd.md`, `conventions.md`, and `srs.md`.
- All four are REQUIRED. A Blueprint project is not valid without them.
- No other files may be placed at docs/ root.

### AGENTS.md

- Lives at the REPOSITORY root, not inside docs/.
- This is the only Blueprint file outside of docs/.

### docs/core/

- Contains all protocol and reference modules.
- Files in core/ are NOT modified during normal project work.
- Modules are loaded on demand per AGENTS.md routing rules.
- New modules may only be added to core/ as part of a Blueprint system update.
- `docs/core/srs-planning.md` is the canonical module for the SRS layer.

### docs/milestones/

- Each milestone gets its own subfolder: `milestone-<n>-<name>/`
- The milestone definition doc lives inside its subfolder.
- All phase docs belonging to that milestone live in the same subfolder.
- No phase doc may exist outside of a milestone folder.
- Revision documents live in their own subfolder: `revision-<n>-<n>/`
  Revision phase docs live in the same subfolder.
  Revisions follow the same subfolder pattern as milestones.
- Naming conventions:
  - Milestone folder: `milestone-<n>-<name>/`
  - Milestone doc: `milestone-<n>-<name>.md`
  - Phase doc: `phase-<n>-<name>.md`
  - Revision folder: `revision-<n>-<n>/`
  - Revision doc: `revision-<n>-<n>.md`

### docs/knowledge-base/

- Created by the CLI when existing non-Blueprint docs need to be preserved.
- Not created by default during setup.
- Contains text-based explanatory documents from before Blueprint was adopted.
- Does NOT contain the project's main README or non-doc files.
- Once stored in the knowledge base, files serve as reference only and are not modified by any active workflow.

### docs/external/

- Created by `blueprint link`, not by default during setup.
- Each linked project gets its own subfolder named by alias.
- Contents are COPIES, not live references. Refreshed by `blueprint sync`.
- Agent treats these as read-only reference for cross-project orientation.
- Contains: prd.md, project-progress.md, and the active milestone doc from the linked project.

---

## What Goes Where

| File type | Location | Created by |
|-----------|----------|------------|
| Agent instructions | Repo root (`AGENTS.md`) | CLI |
| Project state | `docs/project-progress.md` | CLI |
| Product requirements | `docs/prd.md` | CLI / user |
| Project conventions | `docs/conventions.md` | CLI / user |
| Protocol modules | `docs/core/` | CLI |
| Milestone definitions | `docs/milestones/milestone-<n>-<n>/` | milestone-planning.md |
| Phase plans | `docs/milestones/milestone-<n>-<n>/` | phase-planning.md |
| Revision plans | `docs/milestones/` | scope-change.md |
| Pre-Blueprint docs | `docs/knowledge-base/` | CLI |
| Linked project context | `docs/external/<alias>/` | `blueprint link` CLI |

---

## Validation

A valid Blueprint project has ALL of the following:

- [ ] `AGENTS.md` exists at repo root
- [ ] `docs/project-progress.md` exists and contains a kanban project name
- [ ] `docs/prd.md` exists
- [ ] `docs/conventions.md` exists
- [ ] `docs/srs.md` exists
- [ ] `docs/core/` exists and contains `blueprint-structure.md` at minimum
- [ ] `docs/core/srs-planning.md` exists
- [ ] No files at docs/ root other than `project-progress.md`, `prd.md`, `conventions.md`, and `srs.md`
- [ ] Every phase doc is inside a milestone subfolder under `docs/milestones/`

health-check.md uses this checklist to verify project integrity.
