# Conventions

**Project:** blueprint-cli

---

## Tech Stack

- **Runtime:** Node.js (LTS)
- **Package manager:** npm
- **Language:** TypeScript
- **Distribution:** npm global install (`npm install -g @splitwireml/blueprint`)
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

## Releasing

- **Package:** `@splitwireml/blueprint`
- **Release tag format:** `vMAJOR.MINOR.PATCH` (e.g., `v0.1.3`)
- **Release flow:**
  1. Bump version: `npm version <version> --no-git-tag-version`
  2. Run release verification: `npm run release:check`
  3. Commit: `git add package.json package-lock.json && git commit -m "v<version>: <summary>"`
  4. Tag: `git tag v<version>`
  5. Push with tags: `git push origin main --tags`
  6. Verify deployment: `gh run list --limit 5` — confirm both CI and Publish workflows pass
- **Automation:** Pushing a `vMAJOR.MINOR.PATCH` tag triggers the GitHub Actions Publish workflow, which deploys to npm automatically
- **Release contract:** `docs/release-contract.md`
- **Maintainer guide:** `docs/releasing.md`

## Project-Specific Notes

- `blueprint context` output should prioritize: `docs/prd.md`, `docs/project-progress.md`, then current milestone doc
