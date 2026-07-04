This project uses the Blueprint development system.

Invoke the `blueprint` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.

<ProjectConventions>
## Tech Stack

- **Runtime:** Node.js >=18.0.0 (required for the `better-sqlite3` tracker storage backend)
- **Package manager:** npm
- **Language:** TypeScript
- **Distribution:** npm global install (`npm install -g blueprint-agentic-development`)
- **Primary scope:** filesystem and markdown-oriented CLI operations

## Libraries & Tools

- **TypeScript** for type-safe CLI implementation
- **Node built-ins:** `fs`, `path`, `process`, `child_process`
- **Interactive prompts:** `@clack/prompts` (lightweight, styled terminal UI)
- **CLI framework:** custom command runtime (registration + dispatch, no external framework)
- **Dev tooling:** `tsc` + local runner (`tsx`), npm scripts
- **Board UI:** Svelte (dev dependency for local tracker board SPA)

## File Structure

- `src/index.ts` as CLI entrypoint
- `src/commands/` for command handlers (`init`, `link`, `context`)
- `templates/` stores Blueprint scaffold files copied by `init`
- `templates/docs/core/` is copied verbatim
- Root-level docs (`docs/project-progress.md`, `docs/prd.md`, `docs/srs.md`) are scaffolded as editable shells

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
- Don't add runtime dependencies for simple file/I/O tasks
- Don't infer linked-project state from anything except Blueprint docs
- Don't use silent fallback behavior for missing required files

## Anti-Pattern Block Shape

All `<AntiPatterns>` blocks in `docs/core/*.md` use the unfenced canonical XML shape. The wrapper is `<AntiPatterns>` (never `<TweakAntiPatterns>` or other variants). Each `<AntiPattern>` element carries a bare `name="<short title>"` attribute with no `ANTI-PATTERN:` prefix. Required children are `<BadExample>` and `<Why>`. Optional children are `<GoodExample>` and domain-prefixed variants (`<Bad<Domain>Example>`, `<Good<Domain>Example>`, `<GoodSub<Domain>Example>`) when they aid illustration. The block is never wrapped in a ```xml fence. After Phase 2 of Revision 10 lands, `docs/core/srs-planning.md` is the in-repo reference exemplar of this shape.

<AntiPatterns>
  <AntiPattern name="Short Title">
    <BadExample>Description of the forbidden behavior.</BadExample>
    <GoodExample>Description of the correct behavior. (Optional)</GoodExample>
    <Why>One-line explanation of why the bad behavior is forbidden.</Why>
  </AntiPattern>
</AntiPatterns>

## Agent Tools

- **Blueprint skill references** under `.claude/skills/blueprint/reference/` (mirrored from `docs/core/`)
- **Built-in tracker:** per-project task tracker (SQLite backend + local Svelte SPA) provisioned by the CLI
- **Skills:** use only when explicitly requested or clearly applicable

## Releasing

- **Package:** `blueprint-agentic-development` (unscoped, published at npmjs.com/package/blueprint-agentic-development)
- **Release tag format:** `vMAJOR.MINOR.PATCH` (e.g., `v0.2.7`)
- **Release flow:**
  1. Bump version in `package.json`
  2. Run release verification: `npm run release:check`
  3. Commit: `git add package.json && git commit -m "chore: bump version to <version>"`
  4. Tag: `git tag v<version>`
  5. Push with tags: `git push origin main --tags`
  6. Verify deployment: `gh run watch <run-id>` — confirm all steps green including **Publish to npm**
- **Automation:** Pushing a `vMAJOR.MINOR.PATCH` tag triggers the `publish.yml` workflow, which publishes to npm via OIDC trusted publishing (no token required)
- **First publish of a new package name:** Must be done manually (`npm publish`) to establish npm ownership before OIDC takes over
- **OIDC config:** npmjs.com → package Settings → Automated Publishing → repo `masterbatcoderman10/blueprint-cli`, workflow `publish.yml`
- **Release contract:** `docs/release-contract.md`
- **Maintainer guide:** `docs/releasing.md`

## Project-Specific Notes

- `blueprint context` output should prioritize: `docs/prd.md`, `docs/project-progress.md`, then current milestone doc
</ProjectConventions>

<AgentOrchestration>
## Execution Skill Invokation

- All development subagents must use /ponytail and develop following its principles.

## Orchestration Subagent Model

- **Execution** :
  - Use gpt-5.4 xhigh for primary execution.
  - Prompt to gpt-5.5 high if the same stream has failed the same sort of review 2 times in a row.
- **Review** :
  - Use gpt-5.5 xhigh for review and for completion
</AgentOrchestration>
