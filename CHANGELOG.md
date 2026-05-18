# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **R6 — Built-in Task Tracker**: Replace external `vibe-kanban` MCP dependency with a built-in per-project task tracker (Phase 1–4 complete; Phase 5 pending)
  - SQLite-backed tracker with CRUD HTTP server (`better-sqlite3`)
  - Local Svelte SPA board served via `blueprint board` command with auto-open browser
  - Full protocol rewrite: execution, planning, and health-check docs updated for built-in tracker
  - Migration & Doctor integration: automatic DB provisioning, JSON snapshot export/import, schema-currency audit, repo-wide `vibe-kanban` audit
  - SRS requirements MAS-204 (Built-in Task Tracker) and MAS-205 (Local Project Board UI) added

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

[Unreleased]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.7...HEAD
[0.1.7]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/earendil-works/blueprint-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/earendil-works/blueprint-cli/releases/tag/v0.1.0
