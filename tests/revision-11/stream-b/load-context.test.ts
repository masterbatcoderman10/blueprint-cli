import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const SCRIPT_PATH = join(
  ROOT_DIR,
  'templates',
  'skills',
  'blueprint',
  'scripts',
  'load-context.mjs',
)

// ── Fixture helpers ──────────────────────────────────────────────

interface FixtureDir {
  path: string
  cleanup: () => Promise<void>
}

async function createFixtureDir(): Promise<FixtureDir> {
  const tmpDir = await mkdtemp(join(resolve(__dirname), 'fixture-'))
  return {
    path: tmpDir,
    cleanup: () => rm(tmpDir, { recursive: true, force: true }),
  }
}

const POPULATED_PROGRESS = `# Project Progress

**Project**: acme-app
**Tracker**: acme-app
**Current Milestone**: Milestone 1 — Core (Phase 2 in progress)
**Current Phase**: Phase 2 — API Layer (in progress)
**Status**: Phase 2 execution underway. Stream A complete, Stream B in progress.

---

## Decisions

No decisions yet.

---

## Pending Revisions

| Revision | Name | Status | Notes |
|----------|------|--------|-------|
| R3 | Auth Refactor | planned | Scope locked |
| R4 | Error Handling | in progress | Phase 1 complete |
`

const MINIMAL_PROGRESS = `# Project Progress

**Project**: minimal-project

---

## Decisions

No decisions yet.
`

const EMPTY_PROGRESS = `# Project Progress

---

## Decisions

No decisions yet.
`

async function writeProgress(
  fixtureDir: string,
  content: string,
): Promise<void> {
  const docsDir = join(fixtureDir, 'docs')
  await mkdir(docsDir, { recursive: true })
  await writeFile(join(docsDir, 'project-progress.md'), content, 'utf-8')
}

async function writeTrackerDb(fixtureDir: string): Promise<void> {
  const bpDir = join(fixtureDir, 'docs', '.blueprint')
  await mkdir(bpDir, { recursive: true })
  await writeFile(join(bpDir, 'tasks.db'), 'fake-db-content', 'utf-8')
}

// ── Tests ────────────────────────────────────────────────────────

describe('T-R11-1.B.1: load-context.mjs', () => {
  const fixtures: FixtureDir[] = []

  afterAll(async () => {
    await Promise.all(fixtures.map((f) => f.cleanup()))
  })

  it('T-R11-1.B.1.1: populated project prints all five sections in order', async () => {
    const fixture = await createFixtureDir()
    fixtures.push(fixture)
    await writeProgress(fixture.path, POPULATED_PROGRESS)
    await writeTrackerDb(fixture.path)

    const { stdout, stderr } = await execFileAsync('node', [SCRIPT_PATH], {
      cwd: fixture.path,
    })

    expect(stderr).toBe('')

    // All five sections present
    expect(stdout).toContain('## Project')
    expect(stdout).toContain('## Current Milestone')
    expect(stdout).toContain('## Current Phase')
    expect(stdout).toContain('## Pending Revisions')
    expect(stdout).toContain('## Tracker')

    // Sections appear in the required order
    const projectIdx = stdout.indexOf('## Project')
    const milestoneIdx = stdout.indexOf('## Current Milestone')
    const phaseIdx = stdout.indexOf('## Current Phase')
    const revisionsIdx = stdout.indexOf('## Pending Revisions')
    const trackerIdx = stdout.indexOf('## Tracker')

    expect(projectIdx).toBeLessThan(milestoneIdx)
    expect(milestoneIdx).toBeLessThan(phaseIdx)
    expect(phaseIdx).toBeLessThan(revisionsIdx)
    expect(revisionsIdx).toBeLessThan(trackerIdx)

    // Populated values
    expect(stdout).toContain('acme-app')
    expect(stdout).toContain('Milestone 1 — Core')
    expect(stdout).toContain('Phase 2 — API Layer')

    // Tracker initialised
    expect(stdout).toContain('initialised at docs/.blueprint/tasks.db')
  })

  it('T-R11-1.B.1.2: missing sections render _not set_ or _none_', async () => {
    const fixture = await createFixtureDir()
    fixtures.push(fixture)
    await writeProgress(fixture.path, MINIMAL_PROGRESS)
    // No tracker DB

    const { stdout } = await execFileAsync('node', [SCRIPT_PATH], {
      cwd: fixture.path,
    })

    // Project is set
    expect(stdout).toContain('## Project')
    expect(stdout).toMatch(/## Project\s*\n\s*minimal-project/)

    // Missing milestone/phase → _not set_
    expect(stdout).toContain('_not set_')

    // Pending revisions → _none_
    expect(stdout).toContain('_none_')

    // Tracker not initialised
    expect(stdout).toContain('not initialised')
  })

  it('T-R11-1.B.1.3: no docs/.blueprint/ directory renders tracker as not initialised', async () => {
    const fixture = await createFixtureDir()
    fixtures.push(fixture)
    await writeProgress(fixture.path, POPULATED_PROGRESS)
    // Do NOT create docs/.blueprint/

    const { stdout } = await execFileAsync('node', [SCRIPT_PATH], {
      cwd: fixture.path,
    })

    expect(stdout).toContain('## Tracker')
    expect(stdout).toContain('not initialised')
    expect(stdout).not.toContain('initialised at')
  })

  it('T-R11-1.B.1.4: no docs/project-progress.md exits non-zero with clear stderr', async () => {
    const fixture = await createFixtureDir()
    fixtures.push(fixture)
    // Do NOT create docs/project-progress.md

    try {
      await execFileAsync('node', [SCRIPT_PATH], {
        cwd: fixture.path,
      })
      // Should not reach here
      expect(true).toBe(false)
    } catch (err: unknown) {
      const execErr = err as { code?: string | number; stderr?: string }
      expect(String(execErr.code)).toBe('1')
      expect(execErr.stderr).toContain('project-progress.md')
    }
  })

  it('T-R11-1.B.1.5: script is pure Node ESM with no external imports', async () => {
    const { readFile } = await import('node:fs/promises')
    const scriptContent = await readFile(SCRIPT_PATH, 'utf-8')

    // Must use ESM syntax (import/export)
    expect(scriptContent).toMatch(/^import\s/m)

    // Must NOT import from node_modules or external packages
    // Only allowed: node: prefixed builtins and relative imports
    const importLines = scriptContent
      .split('\n')
      .filter((line) => line.trimStart().startsWith('import '))

    for (const line of importLines) {
      // Extract the module specifier
      const match = line.match(/from\s+['"]([^'"]+)['"]/)
      if (match) {
        const specifier = match[1]
        // Allow node: builtins and relative paths only
        const isNodeBuiltin = specifier.startsWith('node:')
        const isRelative = specifier.startsWith('.')
        expect(
          isNodeBuiltin || isRelative,
          `Disallowed import: ${specifier}`,
        ).toBe(true)
      }
    }
  })
})
