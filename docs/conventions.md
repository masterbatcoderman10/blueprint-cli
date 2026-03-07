# Conventions

**Project:** blueprint-cli

---

## Tech Stack

- **Runtime:** Node.js (LTS)
- **Package manager:** npm
- **Language:** TypeScript
- **Distribution:** npm global install (`npm install -g blueprint-cli`)
- **Primary scope:** filesystem and markdown-oriented CLI operations

## Libraries & Tools

- **TypeScript** for type-safe CLI implementation
- **Node built-ins:** `fs`, `path`, `process`, `child_process`
- **Interactive prompts:** `@clack/prompts` (lightweight, styled terminal UI)
- **CLI framework:** custom command runtime (registration + dispatch, no external framework)
- **Dev tooling:** `tsc` + local runner (`tsx`), npm scripts

## File Structure

- `src/index.ts` as CLI entrypoint
- `src/commands/` for command handlers (`init`, `link`, `context`)
- `templates/` stores Blueprint scaffold files copied by `init`
- `templates/docs/core/` is copied verbatim
- Root-level docs (`docs/project-progress.md`, `docs/prd.md`, `docs/conventions.md`) are scaffolded as editable shells

## Coding Standards

- Use strict TypeScript settings
- Keep command handlers small and single-purpose
- Prefer pure helper functions for path/config parsing
- Use clear error messages with actionable CLI output
- Avoid hidden side effects outside explicit command execution

## Testing

- **Framework:** Vitest (recommended default for TypeScript CLI)
- **Runner command:** `npm test` (mapped to `vitest run`)
- **File convention:** `*.test.ts`
- **Location convention:** `tests/` mirrored to `src/` structure
- **Policy:** forward-only coverage for newly implemented functionality

## Anti-Patterns

- Don't couple templates and CLI versions across separate repos
- Don't add runtime dependencies for simple file I/O tasks
- Don't infer linked-project state from anything except Blueprint docs
- Don't use silent fallback behavior for missing required files

## Agent Tools

- **Blueprint protocol docs** under `docs/core/`
- **vibe-kanban MCP:** required for execution tracking, currently not connected
- **Skills:** use only when explicitly requested or clearly applicable

## Project-Specific Notes

- npm package final name is TBD (e.g., `blueprint-dev`, `bpdev`)
- `blueprint context` output should prioritize: `docs/prd.md`, `docs/project-progress.md`, then current milestone doc
