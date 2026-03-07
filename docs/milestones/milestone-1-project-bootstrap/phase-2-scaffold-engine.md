# Phase 2 — Scaffold Engine Plan

**Status**: Planning
**Milestone**: M1 — Project Bootstrap

---

## Goals

- Implement a fully interactive `blueprint init` command that onboards users into the Blueprint system through a guided CLI flow.
- Detect and gracefully handle existing project state — `docs/` directories, scattered `.md` files, agent configuration files, and git status.
- Scaffold a complete Blueprint directory structure with core protocol modules, editable document shells, and agent entry-point files.
- Allow users to select which AI coding agents they use and generate the corresponding configuration files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`).

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 1 — CLI Foundation (command runtime, init stub, test infra) | Complete |
| `@clack/prompts` selected as interactive prompt library | Confirmed |
| Template content bundled in `templates/` inside npm package | Confirmed |
| Node.js `fs`, `path`, `child_process` built-ins available | Available |

---

## Gate 2.0 — Scaffold Infrastructure

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 2.0.1 | Add `@clack/prompts` as a runtime dependency and verify import from CLI entrypoint context | 0.5 | None | Independent |
| 2.0.2 | Define shared types — `InitOptions` interface capturing all user choices (project name, git auth, archive choices, agent selections), scaffold result types, and onboarding step contract | 0.75 | None | Independent |
| 2.0.3 | Build filesystem utility module — recursive `.md` file scanner (excluding `node_modules`, `dist`, `.git`, build output dirs), directory-exists check, safe `mkdir -p`, file copy helper, file move helper | 1.0 | None | Independent |

### Gate Acceptance Criteria

- [ ] `@clack/prompts` installs cleanly and its prompts render in a Node terminal context.
- [ ] `InitOptions` type captures every user decision point in the onboarding flow.
- [ ] Filesystem utilities correctly scan, copy, move, and create directories without data loss.
- [ ] Filesystem scanner excludes `node_modules`, `dist`, `.git`, and other non-project directories.

---

## Stream A — Template Collection

> Create the full set of Blueprint template files that `init` copies into target projects.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Create editable doc shell templates (`project-progress.md`, `prd.md`, `conventions.md`) with `{{project-name}}` placeholder interpolation points | 1.0 | Gate | Dependent |
| A.2 | Create the complete `templates/docs/core/` module set — all 16 protocol files as scaffoldable copies | 1.5 | Gate | Dependent |
| A.3 | Create agent entry-point templates (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`) each pointing to the Blueprint system with agent-appropriate conventions | 1.0 | A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] Editable shell templates contain valid Markdown structure with placeholder tokens for project name.
- [ ] All 16 core protocol modules exist under `templates/docs/core/` and match the canonical Blueprint structure.
- [ ] Each agent template is a valid entry-point file that routes the respective agent into the Blueprint system.
- [ ] `templates/` directory is included in the npm package `files` field.

---

## Stream B — Interactive Onboarding Flow

> Build the step-by-step interactive prompt sequence that collects user choices before any filesystem changes occur.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Build welcome intro screen and project name text input prompt | 0.75 | Gate | Dependent |
| B.2 | Build git detection — check for `.git/` directory, warn if missing, ask permission to run `git init` + `git branch -M main` | 0.75 | B.1 | Dependent |
| B.3 | Build existing `docs/` directory detection — inform user it will be replaced, offer to archive as `docs-archived` inside `knowledge-base/` | 1.0 | B.2 | Dependent |
| B.4 | Build existing `.md` file scanner prompt — list discovered files, offer to move (preferred) or copy into `knowledge-base/`, support per-file or global choice | 1.5 | B.3 | Dependent |
| B.5 | Build agent file detection and selection — detect existing `CLAUDE.md`/`AGENTS.md`/`GEMINI.md`/`QWEN.md`, inform user they will be overwritten (archived to `knowledge-base/`), then multi-select which agents user works with | 1.0 | B.4 | Dependent |
| B.6 | Build confirmation summary — display all planned actions (creates, archives, moves, git ops) and ask for final go-ahead, support abort | 0.75 | B.5 | Dependent |

### Stream B Acceptance Criteria

- [ ] Onboarding flow runs as a linear prompt sequence with styled terminal output via `@clack/prompts`.
- [ ] Project name is captured and passed through to scaffold options.
- [ ] Git absence warning is displayed only when `.git/` is missing; no warning when present.
- [ ] Existing `docs/` and agent files are detected and archive options offered before any destructive action.
- [ ] Recursive `.md` scan excludes non-project directories and presents results clearly.
- [ ] Agent selection defaults to Claude Code (always on) with optional AGENTS.md, GEMINI.md, QWEN.md.
- [ ] Confirmation summary accurately lists every planned action.
- [ ] User can abort at confirmation without any filesystem changes.

---

## Stream C — Execution Engine & Integration

> Perform all filesystem operations based on collected user choices, wire the init command end-to-end, and report results.
> **Depends on:** Stream A (template files exist) and Stream B (onboarding produces `InitOptions`).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| C.1 | Build archive engine — archive existing `docs/` to `knowledge-base/docs-archived`, move or copy scattered `.md` files to `knowledge-base/`, archive existing agent files to `knowledge-base/` | 1.5 | A.1, B.6 | Dependent |
| C.2 | Build scaffold engine — create `docs/` directory tree (`docs/core/`, `docs/knowledge-base/`, `docs/milestones/`), copy core templates verbatim, copy editable shells with project-name interpolation | 1.5 | A.2, C.1 | Dependent |
| C.3 | Build agent file generator — create selected agent entry-point files at project root from templates | 0.75 | A.3, C.2 | Dependent |
| C.4 | Build git initializer — execute `git init` + `git branch -M main` via `child_process` when authorized by user | 0.5 | B.6 | Dependent |
| C.5 | Wire init command — connect onboarding flow → archive → scaffold → agent files → git init → summary, replace Phase 1 no-op stub | 1.0 | C.1, C.2, C.3, C.4 | Dependent |
| C.6 | Build summary reporter — print styled list of all actions taken (files created, files archived, files moved, git status) using `@clack/prompts` outro | 0.5 | C.5 | Dependent |

### Stream C Acceptance Criteria

- [ ] Archive engine preserves all existing content without data loss before scaffold overwrites.
- [ ] Scaffold engine produces the complete Blueprint directory structure matching canonical layout.
- [ ] Editable shell documents contain the user-provided project name, not raw placeholders.
- [ ] Agent files are created only for user-selected agents; `CLAUDE.md` is always created.
- [ ] Git init runs only when authorized and only when `.git/` is absent.
- [ ] Init command handler replaces the Phase 1 no-op stub and integrates the full flow.
- [ ] Summary accurately reports every filesystem and git action performed.
- [ ] Ctrl+C or abort at any point leaves the filesystem unchanged (no partial scaffolds).

---

## Parallelization Map

```text
Gate 2.0 (Scaffold Infrastructure) ────────────────┐
                                                    │
                ┌──────────────────────────────────┤
                │                                  │
Stream A (Template Collection) ──────────────────► │
Stream B (Interactive Onboarding) ───────────────► │
                │                                  │
                └── Stream C (Execution & Integration)
                    depends on A + B ─────────────►│
                                                   │
                                                   ▼
                                         Phase 2 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate 2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-2.0.1 | 2.0.1 | Unit | Verify `@clack/prompts` can be imported and key exports (`intro`, `text`, `select`, `multiselect`, `confirm`, `outro`) are available | All named exports are defined functions |
| T-2.0.2 | 2.0.2 | Unit | Verify `InitOptions` and scaffold result types are importable and a conforming object can be constructed | Object matching `InitOptions` shape passes type-check and contains all expected fields |
| T-2.0.3.1 | 2.0.3 | Unit | Recursive `.md` scanner finds markdown files in nested directories | Returns paths for all `.md` files under a test fixture tree |
| T-2.0.3.2 | 2.0.3 | Unit | Recursive `.md` scanner excludes `node_modules/`, `dist/`, `.git/`, and build output dirs | Returns empty or filtered list when `.md` files only exist inside excluded dirs |
| T-2.0.3.3 | 2.0.3 | Unit | `directoryExists` returns `true` for existing dir and `false` for missing dir | Correct boolean for each case |
| T-2.0.3.4 | 2.0.3 | Unit | `safeMkdirP` creates nested directory structure | Directory tree exists after call |
| T-2.0.3.5 | 2.0.3 | Unit | `copyFile` helper copies file content and preserves contents | Destination file matches source contents |
| T-2.0.3.6 | 2.0.3 | Unit | `moveFile` helper moves file (source removed, destination created) | Destination exists with correct content, source no longer exists |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | A.1 | Unit | Editable shell templates (`project-progress.md`, `prd.md`, `conventions.md`) exist under `templates/` | All three template files are present |
| T-A.1.2 | A.1 | Unit | Editable shell templates contain `{{project-name}}` placeholder token | Each template includes at least one `{{project-name}}` occurrence |
| T-A.2.1 | A.2 | Unit | All 16 core protocol files exist under `templates/docs/core/` | Exactly 16 `.md` files present matching the canonical Blueprint structure |
| T-A.2.2 | A.2 | Unit | Core protocol template files are valid Markdown (non-empty, begin with heading) | Each file has non-zero length and starts with `#` |
| T-A.3.1 | A.3 | Unit | Agent entry-point templates exist for all four agents (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`) | All four template files are present under `templates/` |
| T-A.3.2 | A.3 | Unit | Each agent template references the Blueprint system entry point | Each file contains a reference to `docs/` or the Blueprint protocol |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Unit | Project name validation rejects empty string input | Validation returns error/falsy for `""` |
| T-B.1.2 | B.1 | Unit | Project name validation accepts valid non-empty string | Validation returns success/truthy for `"my-project"` |
| T-B.2.1 | B.2 | Unit | Git detection returns `true` when `.git/` directory exists | Returns `true` in a git-initialized fixture dir |
| T-B.2.2 | B.2 | Unit | Git detection returns `false` when `.git/` directory is absent | Returns `false` in a non-git fixture dir |
| T-B.3 | B.3 | Unit | Existing docs detection correctly identifies presence/absence of `docs/` directory | Returns `true` when `docs/` exists, `false` when absent |
| T-B.4 | B.4 | Integration | Markdown file scanner integrates with fs utilities to produce a file list from a fixture tree with scattered `.md` files | Returns correct list of `.md` file paths, excluding ignored directories |
| T-B.5.1 | B.5 | Unit | Agent file detection identifies existing agent files at project root | Returns list containing detected files (e.g., `["CLAUDE.md", "GEMINI.md"]`) |
| T-B.5.2 | B.5 | Unit | Agent file detection returns empty list when no agent files exist | Returns `[]` for a clean directory |
| T-B.6 | B.6 | Unit | Confirmation summary generator produces correct action list from a populated `InitOptions` | Summary includes all planned creates, archives, moves, and git ops matching the input options |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | C.1 | Integration | Archive engine moves existing `docs/` to `knowledge-base/docs-archived` | `docs-archived/` exists under `knowledge-base/` with original contents; original `docs/` removed |
| T-C.1.2 | C.1 | Integration | Archive engine moves scattered `.md` files to `knowledge-base/` | Target files appear in `knowledge-base/`, originals removed |
| T-C.1.3 | C.1 | Integration | Archive engine moves existing agent files to `knowledge-base/` | Agent files preserved in `knowledge-base/`, originals removed |
| T-C.2.1 | C.2 | Integration | Scaffold engine creates the complete Blueprint directory tree (`docs/`, `docs/core/`, `docs/knowledge-base/`, `docs/milestones/`) | All expected directories exist after scaffold |
| T-C.2.2 | C.2 | Integration | Scaffold engine copies core protocol templates verbatim into `docs/core/` | All 16 files present in `docs/core/` with content matching templates |
| T-C.2.3 | C.2 | Integration | Scaffold engine interpolates `{{project-name}}` in editable shell documents with the user-provided project name | `project-progress.md`, `prd.md`, `conventions.md` contain the actual project name, no raw `{{project-name}}` tokens remain |
| T-C.3.1 | C.3 | Unit | Agent file generator creates files only for selected agents | Selecting `["CLAUDE.md", "GEMINI.md"]` creates only those two files at project root |
| T-C.3.2 | C.3 | Unit | Agent file generator always creates `CLAUDE.md` regardless of selection | Even with empty selection, `CLAUDE.md` is generated |
| T-C.4.1 | C.4 | Integration | Git initializer creates `.git/` directory with `main` branch when authorized | `.git/` exists and `git branch --show-current` returns `main` |
| T-C.4.2 | C.4 | Integration | Git initializer does nothing when not authorized | `.git/` does not appear when `gitInit: false` |
| T-C.5 | C.5 | End-to-End | Full `init` command in empty directory produces complete Blueprint structure with selected agents | All expected dirs, core files, shell docs, and agent files are present; no-op stubs for `link`/`context` still work |
| T-C.6 | C.6 | Unit | Summary reporter returns correct action list reflecting all operations performed | Output data structure lists every created, archived, and moved file |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate 2.0 | 3 | 3 | 0 |
| Stream A | 3 | 3 | 0 |
| Stream B | 6 | 6 | 0 |
| Stream C | 6 | 6 | 0 |
| **Total** | **18** | **18** | **0** |

---

## Definition of Done

- [ ] Gate 2.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] `blueprint init` in a fresh empty directory produces a valid, complete Blueprint structure.
- [ ] `blueprint init` in a project with existing `docs/` and `.md` files archives content before scaffolding.
- [ ] No lint/typecheck errors in files touched by this phase.
- [ ] `@clack/prompts` is the only new runtime dependency added.
- [ ] `link` and `context` commands remain as no-op stubs (not implemented in this phase).
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path
- [ ] Running `blueprint init` in an empty directory scaffolds the full Blueprint structure with all selected agent files.
- [ ] Project name entered by user appears in scaffolded `project-progress.md`, `prd.md`, and `conventions.md`.
- [ ] Selecting all four agents creates `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` at project root.
- [ ] Running in a git-initialized project skips the git warning and init step entirely.
- [ ] Summary output lists every file created.

### Edge Cases
- [ ] Existing `docs/` is archived to `knowledge-base/docs-archived` before scaffold replaces it.
- [ ] Existing `CLAUDE.md` content is preserved in `knowledge-base/` before being overwritten.
- [ ] Recursive `.md` scan finds files in nested directories but skips `node_modules/`, `dist/`, `.git/`.
- [ ] User aborts at confirmation prompt — no files are created, moved, or deleted.
- [ ] Running `blueprint init` in a directory with no `.md` files and no `docs/` skips archive steps silently.
- [ ] Git init failure (e.g., git not installed) produces a clear error and continues scaffold without crashing.
- [ ] Empty project name input is rejected with a re-prompt.

---
