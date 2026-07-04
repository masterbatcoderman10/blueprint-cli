import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import { CANONICAL_CORE_FILES, getCanonicalStructurePaths, isEditableProjectDoc } from '../../../src/doctor/structure'
import { runDoctorAudit } from '../../../src/doctor/audit'
import { resolveAllSkillTemplatePaths } from '../../../src/doctor/inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'
import { copySkillModeAgentStubs, generateAgentFiles, scaffoldBlueprintDirectory } from '../../../src/init/archive-engine'
import type { InitOptions, Mode } from '../../../src/init/types'
import { openDb } from '../../../src/tracker/db'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

const ROOT_DIR = resolve(__dirname, '../../../')
const TEMPLATES_DIR = resolve(ROOT_DIR, 'templates')
const SNIPPET_PATH = resolve(TEMPLATES_DIR, 'skill', '_project-conventions.snippet.md')
const AGENT_SKILL_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

const REQUIRED_SKILL_INTRO = `This project uses the Blueprint development system.

Invoke the \`blueprint\` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.
`
const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'

function makeInitOptions(mode: Mode): InitOptions {
  return {
    projectName: 'test-project',
    projectTagline: 'A project used for test coverage',
    mode,
    git: {
      hasExistingRepository: false,
      shouldInitialize: false,
      shouldSetMainBranch: false,
    },
    docs: {
      hasExistingDocsDirectory: false,
      shouldArchiveExistingDocs: false,
      archiveDirectoryName: 'docs-archived',
    },
    markdownMigration: {
      discoveredMarkdownPaths: [],
      transferMode: 'skip',
      selectedPaths: [],
    },
    agents: {
      selected: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'],
      detectedExisting: [],
      shouldArchiveExistingAgentFiles: false,
      ensureClaudeEntryPoint: true,
    },
    confirmation: {
      confirmed: true,
    },
  }
}

function bodyAfterFirstLine(content: string): string {
  const lines = content.split('\n')
  return lines.slice(1).join('\n')
}

const tempDirs: string[] = []

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function writeSeedManifest(projectDir: string, managedFiles: string[] = ['CLAUDE.md']): Promise<void> {
  const manifestDir = resolve(projectDir, ...MANIFEST_RELATIVE_PATH.split('/').slice(0, -1))
  const manifestPath = resolve(projectDir, MANIFEST_RELATIVE_PATH)
  await mkdir(manifestDir, { recursive: true })
  await writeFile(
    manifestPath,
    JSON.stringify({ templateVersion: TEMPLATE_VERSION, cliVersion: '0.1.0', managedFiles }, null, 2),
    'utf-8',
  )

  const now = Date.now()
  const handle = openDb(projectDir)
  handle.db
    .prepare('INSERT OR REPLACE INTO project_meta (id, name, tagline, created_at, updated_at) VALUES (1, ?, ?, ?, ?)')
    .run('test-project', 'Test project', now, now)
  handle.db.close()
}

async function writeSeedSkillProject(projectDir: string, skillBase: string): Promise<void> {
  await mkdir(resolve(projectDir, 'docs/tweaks'), { recursive: true })
  for (const { relativePath, absolutePath } of resolveAllSkillTemplatePaths(skillBase)) {
    const destination = resolve(projectDir, relativePath)
    await mkdir(resolve(destination, '..'), { recursive: true })
    await writeFile(destination, await readFile(absolutePath, 'utf-8'), 'utf-8')
  }
  await writeSeedManifest(projectDir, [])
}

const CONVENTIONS_SNIPPET_SECTIONS: string[] = [
  '## Tech Stack',
  '## Libraries & Tools',
  '## File Structure',
  '## Coding Standards',
  '## Testing',
  '## Anti-Patterns',
  '## Anti-Pattern Block Shape',
  '## Agent Tools',
  '## Releasing',
  '## Project-Specific Notes',
]

const SNIPPET_SNAPSHOT_LINES: string[] = [
  '<ProjectConventions>',
  '## Tech Stack',
  '',
  '- **Runtime:** Node.js >=18.0.0 (required for the `better-sqlite3` tracker storage backend)',
  '- **Package manager:** npm',
  '- **Language:** TypeScript',
  '- **Distribution:** npm global install (`npm install -g blueprint-agentic-development`)',
  '- **Primary scope:** filesystem and markdown-oriented CLI operations',
  '',
  '## Libraries & Tools',
  '',
  '- **TypeScript** for type-safe CLI implementation',
  '- **Node built-ins:** `fs`, `path`, `process`, `child_process`',
  '- **Interactive prompts:** `@clack/prompts` (lightweight, styled terminal UI)',
  '- **CLI framework:** custom command runtime (registration + dispatch, no external framework)',
  '- **Dev tooling:** `tsc` + local runner (`tsx`), npm scripts',
  '- **Board UI:** Svelte (dev dependency for local tracker board SPA)',
  '',
  '## File Structure',
  '',
  '- `src/index.ts` as CLI entrypoint',
  '- `src/commands/` for command handlers (`init`, `link`, `context`)',
  '- `templates/` stores Blueprint scaffold files copied by `init`',
  '- `templates/docs/core/` is copied verbatim',
  '- Root-level docs (`docs/project-progress.md`, `docs/prd.md`, `docs/srs.md`) are scaffolded as editable shells',
  '',
  '## Coding Standards',
  '',
  '- Use strict TypeScript settings',
  '- Keep command handlers small and single-purpose',
  '- Prefer pure helper functions for path/config parsing',
  '- Use clear error messages with actionable CLI output',
  '- Avoid hidden side effects outside explicit command execution',
  '',
  '## Testing',
  '',
  '- **Framework:** Vitest (recommended default for TypeScript CLI)',
  '- **Runner command:** `npm test` (mapped to `vitest run`)',
  '- **File convention:** `*.test.ts`',
  '- **Location convention:** `tests/` mirrored to `src/` structure',
  '- **Policy:** forward-only coverage for newly implemented functionality',
  '',
  '## Anti-Patterns',
  '',
  "- Don't couple templates and CLI versions across separate repos",
  "- Don't add runtime dependencies for simple file/I/O tasks",
  "- Don't infer linked-project state from anything except Blueprint docs",
  "- Don't use silent fallback behavior for missing required files",
  '',
  '## Anti-Pattern Block Shape',
  '',
  "All `<AntiPatterns>` blocks in `docs/core/*.md` use the unfenced canonical XML shape. The wrapper is `<AntiPatterns>` (never `<TweakAntiPatterns>` or other variants). Each `<AntiPattern>` element carries a bare `name=\"<short title>\"` attribute with no `ANTI-PATTERN:` prefix. Required children are `<BadExample>` and `<Why>`. Optional children are `<GoodExample>` and domain-prefixed variants (`<Bad<Domain>Example>`, `<Good<Domain>Example>`, `<GoodSub<Domain>Example>`) when they aid illustration. The block is never wrapped in a ```xml fence. After Phase 2 of Revision 10 lands, `docs/core/srs-planning.md` is the in-repo reference exemplar of this shape.",
  '',
  '<AntiPatterns>',
  '  <AntiPattern name=\"Short Title\">',
  '    <BadExample>Description of the forbidden behavior.</BadExample>',
  '    <GoodExample>Description of the correct behavior. (Optional)</GoodExample>',
  '    <Why>One-line explanation of why the bad behavior is forbidden.</Why>',
  '  </AntiPattern>',
  '</AntiPatterns>',
  '',
  '## Agent Tools',
  '',
  '- **Blueprint skill references** under `.claude/skills/blueprint/reference/` (mirrored from `docs/core/`)',
  '- **Built-in tracker:** per-project task tracker (SQLite backend + local Svelte SPA) provisioned by the CLI',
  '- **Skills:** use only when explicitly requested or clearly applicable',
  '',
  '## Releasing',
  '',
  '- **Package:** `blueprint-agentic-development` (unscoped, published at npmjs.com/package/blueprint-agentic-development)',
  '- **Release tag format:** `vMAJOR.MINOR.PATCH` (e.g., `v0.2.7`)',
  '- **Release flow:**',
  '  1. Bump version in `package.json`',
  '  2. Run release verification: `npm run release:check`',
  '  3. Commit: `git add package.json && git commit -m \"chore: bump version to <version>\"`',
  '  4. Tag: `git tag v<version>`',
  '  5. Push with tags: `git push origin main --tags`',
  '  6. Verify deployment: `gh run watch <run-id>` — confirm all steps green including **Publish to npm**',
  '- **Automation:** Pushing a `vMAJOR.MINOR.PATCH` tag triggers the `publish.yml` workflow, which publishes to npm via OIDC trusted publishing (no token required)',
  '- **First publish of a new package name:** Must be done manually (`npm publish`) to establish npm ownership before OIDC takes over',
  '- **OIDC config:** npmjs.com → package Settings → Automated Publishing → repo `masterbatcoderman10/blueprint-cli`, workflow `publish.yml`',
  '- **Release contract:** `docs/release-contract.md`',
  '- **Maintainer guide:** `docs/releasing.md`',
  '',
  '## Project-Specific Notes',
  '',
  '- `blueprint context` output should prioritize: `docs/prd.md`, `docs/project-progress.md`, then current milestone doc',
  '</ProjectConventions>',
]

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R11-3.A.1: delete sunsetted conventions docs', () => {
  it('T-R11-3.A.1.1: conventions docs and template mirrors are absent', () => {
    expect(existsSync(resolve(ROOT_DIR, 'docs/conventions.md'))).toBe(false)
    expect(existsSync(resolve(TEMPLATES_DIR, 'conventions.md'))).toBe(false)
    expect(existsSync(resolve(TEMPLATES_DIR, 'docs', 'conventions.md'))).toBe(false)
  })
})

describe('R11-3.A.2: drop conventions.md from editable shell scaffolding', () => {
  it('T-R11-3.A.2.1: shellFiles list contains only prd, srs, project-progress', () => {
    const source = readFileSync(resolve(ROOT_DIR, 'src', 'init', 'archive-engine.ts'), 'utf-8')
    expect(source).toContain("const shellFiles = ['project-progress.md', 'prd.md', 'srs.md']")
  })

  it('T-R11-3.A.2.2: legacy and skill scaffold flows never emit docs/conventions.md', async () => {
    const legacyRoot = await makeTempDir('blueprint-r11-3-a2-legacy-')
    const skillRoot = await makeTempDir('blueprint-r11-3-a2-skill-')

    const legacyOptions = makeInitOptions('legacy')
    const skillOptions = makeInitOptions('skill')

    await scaffoldBlueprintDirectory(legacyRoot, legacyOptions)
    await generateAgentFiles(legacyRoot, legacyOptions)
    expect(existsSync(join(legacyRoot, 'docs', 'conventions.md'))).toBe(false)
    expect(existsSync(join(legacyRoot, 'docs', 'project-progress.md'))).toBe(true)
    expect(existsSync(join(legacyRoot, 'docs', 'prd.md'))).toBe(true)
    expect(existsSync(join(legacyRoot, 'docs', 'srs.md'))).toBe(true)

    await scaffoldBlueprintDirectory(skillRoot, skillOptions)
    await copySkillModeAgentStubs(skillRoot, skillOptions)
    expect(existsSync(join(skillRoot, 'docs', 'conventions.md'))).toBe(false)
    expect(existsSync(join(skillRoot, 'docs', 'project-progress.md'))).toBe(true)
    expect(existsSync(join(skillRoot, 'docs', 'prd.md'))).toBe(true)
    expect(existsSync(join(skillRoot, 'docs', 'srs.md'))).toBe(true)
  })
})

describe('R11-3.A.3: remove conventions.md from Doctor legacy structure', () => {
  it('T-R11-3.A.3.1: CANONICAL_CORE_FILES excludes docs/conventions.md', () => {
    expect(CANONICAL_CORE_FILES).not.toContain('docs/conventions.md')
    expect(getCanonicalStructurePaths()).not.toContain('docs/conventions.md')
    expect(isEditableProjectDoc('docs/conventions.md')).toBe(false)
  })

  it('T-R11-3.A.3.2: canonical-set helper output excludes docs/conventions.md', () => {
    const canonicalPaths = getCanonicalStructurePaths()

    expect(canonicalPaths).not.toContain('docs/conventions.md')
    expect(canonicalPaths).toContain('docs/.blueprint/manifest.json')
  })

  it('T-R11-3.A.3.2: legacy audit on a project missing docs/conventions.md is clean', async () => {
    const projectDir = await makeTempDir('blueprint-r11-3-a3-legacy-')
    await writeCanonicalProject(projectDir, { includeManifest: true, includeTracker: true, managedFiles: ['CLAUDE.md'] })
    await rm(join(projectDir, 'docs', 'conventions.md'))

    const result = await runDoctorAudit(projectDir)
    const findings = result.findings.map((finding) => finding.targetPath)

    expect(result.isClean).toBe(true)
    expect(findings).not.toContain('docs/conventions.md')
  })

  it('T-R11-3.A.3.3: skill-mode canonical-set has no conventions.md findings', async () => {
    const skillRoot = await makeTempDir('blueprint-r11-3-a3-skill-')
    await writeSeedSkillProject(skillRoot, '.claude/skills/blueprint')

    const result = await runDoctorAudit(skillRoot)
    const findings = result.findings.map((finding) => finding.targetPath)

    expect(result.mode).toBe('skill')
    expect(result.isClean).toBe(true)
    expect(findings).not.toContain('docs/conventions.md')
    expect(findings).not.toContain('docs/core/align.md')
  })
})

describe('R11-3.A.4: create canonical skill ProjectConventions snippet', () => {
  it('T-R11-3.A.4.1: snippet file exists and has expected sections', async () => {
    expect(existsSync(SNIPPET_PATH)).toBe(true)

    const snippet = await readFile(SNIPPET_PATH, 'utf-8')
    for (const section of CONVENTIONS_SNIPPET_SECTIONS) {
      expect(snippet).toContain(section)
    }
  })

  it('T-R11-3.A.4.2: snippet body is the exact snapshot', async () => {
    const snippet = (await readFile(SNIPPET_PATH, 'utf-8')).trim()
    expect(snippet).toBe(SNIPPET_SNAPSHOT_LINES.join('\n'))
  })
})

describe('R11-3.A.5: keep skill templates generic after conventions sunset', () => {
  it('T-R11-3.A.5.1: each skill template is a generic placeholder surface', async () => {
    for (const fileName of AGENT_SKILL_FILES) {
      const content = await readFile(join(TEMPLATES_DIR, 'skill', fileName), 'utf-8')
      expect(content.startsWith(REQUIRED_SKILL_INTRO)).toBe(true)
      expect(content).toContain('<ProjectConventions>')
      expect(content).toContain('<AgentOrchestration>')
      expect(content.trimEnd().endsWith(ALIGNMENT_REQUIRED_MARKER)).toBe(true)
      expect(content).not.toContain('Node.js >=18.0.0')
      expect(content).not.toContain('blueprint-agentic-development')
      expect(content).not.toContain('/ponytail')
    }
  })

  it('T-R11-3.A.5.2: skill templates share one byte-identical body', async () => {
    const referenceBody = bodyAfterFirstLine(await readFile(join(TEMPLATES_DIR, 'skill', AGENT_SKILL_FILES[0]), 'utf-8'))
    const bodyBodies = new Set<string>()

    for (const fileName of AGENT_SKILL_FILES) {
      const content = await readFile(join(TEMPLATES_DIR, 'skill', fileName), 'utf-8')
      bodyBodies.add(bodyAfterFirstLine(content))
    }

    expect(bodyBodies.has(referenceBody)).toBe(true)
    expect(bodyBodies.size).toBe(1)
  })
})
