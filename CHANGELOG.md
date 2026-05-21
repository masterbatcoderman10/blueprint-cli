# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.8] — 2026-05-21

### Changed
- **README**: Rewrote "What is Blueprint?" opening with original copy; removed similarity to third-party project descriptions

## [0.2.7] — 2026-05-21

### Changed
- **README**: Updated install instructions, badges, and recent updates to reflect new package name
- **Changelog**: Backfilled entries for 0.2.4–0.2.6

## [0.2.6] — 2026-05-21

### Changed
- **Package rename**: Renamed from `@splitwireml/blueprint` to `blueprint-agentic-development`
- **npm metadata**: Description and keywords updated to reflect the agentic development framing
- Updated all internal references, release contract, tests, and docs to new package name

## [0.2.5] — 2026-05-21

### Changed
- Version bump to resolve tag conflict during package rename migration

## [0.2.4] — 2026-05-20

### Added
- **R8 Phase 2 — Tweak Planning Flow Rewrite**: Complete rewrite of the tweak planning flow for parallel agent execution
  - Tweak workflow hardened as a first-class autonomous planning mode
  - Parallel stream execution improved with clearer agent dispatch contracts
  - Acceptance criteria and verification protocols tightened across all tweak-related modules

## [0.2.3] — 2026-05-20

### Added
- **R7 — Standalone Tweak Workflow**: Promoted tweaks from inline phase corrections into a first-class, top-level quick-change workflow
  - `docs/tweaks/` becomes a required Blueprint directory, scaffolded into every initialized project
  - Each tweak gets a standalone Markdown plan with goals, dependencies, tasks, acceptance criteria, and verification notes
  - Core protocol docs rewritten: `tweak-planning.md`, `phase-planning.md`, `blueprint-structure.md`, `hierarchy.md`, `scope-change.md`, `revision-planning.md`, `execution.md`, `review.md`, `phase-completion.md`, `test-planning.md`, `orchestrate.md`
  - Scaffold engine, Doctor validation, and template mirroring updated for standalone tweak contract
  - Agent routing documents (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`) updated to route tweak intent as top-level quick-change planning
  - Historical Revision 2 tweak contract superseded; historical docs preserved as audit history

### Improved
- **README redesign**: Streamlined structure with task tracker screenshot, clearer "How It Works" section, and direct professional tone. Reduced cognitive load for new users.

## [0.2.0] — 2026-05-19

### Added
- **R6 — Built-in Task Tracker**: Replace external `vibe-kanban` MCP dependency with a built-in per-project task tracker (all 5 phases complete)
  - SQLite-backed tracker with CRUD HTTP server (`better-sqlite3`)
  - Local Svelte SPA board served via `blueprint board` command with auto-open browser
  - Full protocol rewrite: execution, planning, and health-check docs updated for built-in tracker
  - Migration & Doctor integration: automatic DB provisioning, JSON snapshot export/import, schema-currency audit, repo-wide `vibe-kanban` audit
  - Milestone field on all tasks with automatic derivation from task ID; milestone filter in board UI
  - SRS requirements MAS-204 (Built-in Task Tracker) and MAS-205 (Local Project Board UI) transitioned to active

### Fixed
- **Board SPA — Task state mapping**: Tasks were always rendered in the To Do column because the UI read `task.status` but the server returns `task.state`; all tasks now route to the correct column
- **Board SPA — Column scroll**: Task cards overflowed their column instead of scrolling; columns now scroll smoothly with hidden scrollbar
- **Board SPA — Filter dropdowns**: Native `<select>` elements replaced with custom dark-themed dropdown components; filter options no longer shrink when a filter is active (options now sourced from the full unfiltered task list)

## [0.1.7] — 2026-05-17

### Added
- **R5 — Orchestration Protocol**: New `docs/core/orchestrate.md` core module that turns an agent into a phase/stream orchestrator with parallel-subagent dispatch and independent per-stream execute→review→address→rereview loops
  - Routing rows added to all agent entry points and project `CLAUDE.md`
  - Template propagation via `templates/docs/core/orchestrate.md`
  - Doctor / template-integrity canonical-core-file list expanded
  - Phase-completion orchestration sub-step, review subagent merge, and phase completion loop tweaks (R5-1.TW1–TW3)

## [0.1.6] — 2026-05-17

### Added
- **R4 Phase 4 — Verification & Cleanup**: Final anti-pattern verification pass across all core modules

### Changed
- **R4 — Anti-Patterns**: Process constraints and "what-not-to-do" guidance added to core documentation (alignment, srs-planning, milestone-planning, phase-planning, revision-planning, git-execution-workflow)

## [0.1.5] — 2026-03-29

### Added
- **R3 — SRS Integration**: Software Requirements Specification document as a progressive source of truth bridging the PRD and phase plans
  - Phase 1: SRS module & structural registration (`docs/srs.md`, `docs/core/srs-planning.md`, Doctor/alignment integration)
  - Phase 2: Alignment & PRD flow rework (SRS population from alignment, PRD milestone SRS references)
  - Phase 3: Planning module integration (milestone-planning and phase-planning updated to produce/reference SRS requirements)

## [0.1.4] — 2026-03-26

### Added
- **R2 — Tweak Contract**: Lightweight in-phase correction mechanism (`blueprint tweak`) for correcting completed tasks within the current phase without a full revision
  - Tweak contract & template integration in scaffold engine and Doctor

### Changed
- Releasing workflow documentation added to conventions

## [0.1.3] — 2026-03-22

### Added
- **R1 — CLI Discoverability & Help**: Complete overhaul of CLI help and error recovery UX
  - Phase 1: Root help & dispatch contract — meaningful top-level help output
  - Phase 2: Incorrect command recovery & command-level guidance — smart suggestions on typos/unknown commands
  - Phase 3: Documentation & regression coverage alignment — README overhaul, comprehensive regression test suite

### Fixed
- Release-contract link assertion format alignment
- Recovery example matching actual CLI output
- `.gitignore` updated for `node_modules` symlink and `.nosync` directory

## [0.1.2] — 2026-03-21

### Added
- **R1 Phase 1 — Root Help & Dispatch Contract**: Root invocation help redesign with comprehensive Blueprint overview and planning workflow in README

### Fixed
- README tests updated to match revised content
- Stream B test file restored after accidental deletion

## [0.1.1] — 2026-03-18

### Changed
- Switched to trusted npm publishing workflow
- Updated planning core directives

## [0.1.0] — 2026-03-16

### Added
- **M1 — Project Bootstrap**: Initial release of Blueprint CLI
  - **Phase 1 — CLI Foundation**: Core command dispatch, `blueprint init`, `blueprint upgrade` commands
  - **Phase 2 — Scaffold Engine**: Archive engine, scaffold engine, agent file generator, git initializer, and summary reporter
  - **Phase 3 — Template Integrity**: Manifest & scaffold metadata reader/writer, `blueprint doctor` audit flow, repair planner & executor, Doctor command integration, Gate 3.0 integrity contract
  - **Phase 4 — Testing Setup & Release Readiness**: Full Vitest test suite (266 tests), CI packaging, release workflow
- MIT license
- Core protocol modules: git workflow, planning, phase-planning, milestone-planning, execution, review, phase-completion, bug-resolution, scope-change, revision-planning, health-check, alignment

### Fixed
- Minimum Node.js version bumped to 20 for `@clack/prompts` `styleText` compatibility

[Unreleased]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.8...HEAD
[0.2.8]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.2.0...v0.2.3
[0.2.0]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/masterbatcoderman10/blueprint-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/masterbatcoderman10/blueprint-cli/releases/tag/v0.1.0
