import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { afterAll, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const SCRIPT_PATHS = [
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'scripts', 'load-context.mjs'),
  join(ROOT_DIR, 'skills', 'blueprint', 'scripts', 'load-context.mjs'),
]
const PROJECT_PROGRESS_TEMPLATE_PATH = join(ROOT_DIR, 'templates', 'project-progress.md')

const EMPTY_PROGRESS = `# Project Progress

**Project**: bootstrap-project

---

## Decisions

No decisions yet.
`

const POPULATED_PROGRESS = `# Project Progress

**Project**: acme-app
**Current Milestone**: Revision 12 — Bootstrap Contract
**Current Phase**: Gate R12-1.0 — Bootstrap Contract Canon

---

## Pending Revisions

| Revision | Name | Status | Notes |
|----------|------|--------|-------|
| R12 | Alignment Split | in progress | Gate active |
`

interface FixtureDir {
  path: string
  cleanup: () => Promise<void>
}

function expectSectionsInOrder(output: string): void {
  const projectIdx = output.indexOf('## Project')
  const milestoneIdx = output.indexOf('## Current Milestone')
  const phaseIdx = output.indexOf('## Current Phase')
  const progressStateIdx = output.indexOf('## Progress State')
  const alignmentIdx = output.indexOf('## Alignment Markers')
  const originIdx = output.indexOf('## Project Origin')
  const revisionsIdx = output.indexOf('## Pending Revisions')
  const trackerIdx = output.indexOf('## Tracker')

  expect(projectIdx).toBeLessThan(milestoneIdx)
  expect(milestoneIdx).toBeLessThan(phaseIdx)
  expect(phaseIdx).toBeLessThan(progressStateIdx)
  expect(progressStateIdx).toBeLessThan(alignmentIdx)
  expect(alignmentIdx).toBeLessThan(originIdx)
  expect(originIdx).toBeLessThan(revisionsIdx)
  expect(revisionsIdx).toBeLessThan(trackerIdx)
}

async function createFixtureDir(): Promise<FixtureDir> {
  const tmpDir = await mkdtemp(join(resolve(__dirname), 'load-context-r12-'))
  return {
    path: tmpDir,
    cleanup: () => rm(tmpDir, { recursive: true, force: true }),
  }
}

async function writeProgress(fixtureDir: string, content: string): Promise<void> {
  await mkdir(join(fixtureDir, 'docs'), { recursive: true })
  await writeFile(join(fixtureDir, 'docs', 'project-progress.md'), content, 'utf-8')
}

async function writeTrackerDb(fixtureDir: string): Promise<void> {
  await mkdir(join(fixtureDir, 'docs', '.blueprint'), { recursive: true })
  await writeFile(join(fixtureDir, 'docs', '.blueprint', 'tasks.db'), 'fake-db-content', 'utf-8')
}

async function writeRootFile(
  fixtureDir: string,
  fileName: string,
  lines: string[],
): Promise<void> {
  await writeFile(join(fixtureDir, fileName), lines.join('\n') + '\n', 'utf-8')
}

describe('R12-1.0.3 load-context bootstrap reporting', () => {
  const fixtures: FixtureDir[] = []

  afterAll(async () => {
    await Promise.all(fixtures.map((fixture) => fixture.cleanup()))
  })

  it.each(SCRIPT_PATHS)(
    'T-R12-1.0.3.1: %s distinguishes empty progress shell from populated progress with and without tracker state in stable order',
    async (scriptPath) => {
      const scenarios = [
        {
          progress: EMPTY_PROGRESS,
          tracker: false,
          expectedProgressState: 'empty progress shell',
          expectedTrackerState: 'not initialised',
        },
        {
          progress: EMPTY_PROGRESS,
          tracker: true,
          expectedProgressState: 'empty progress shell',
          expectedTrackerState: 'initialised at docs/.blueprint/tasks.db',
        },
        {
          progress: POPULATED_PROGRESS,
          tracker: false,
          expectedProgressState: 'populated progress',
          expectedTrackerState: 'not initialised',
        },
        {
          progress: POPULATED_PROGRESS,
          tracker: true,
          expectedProgressState: 'populated progress',
          expectedTrackerState: 'initialised at docs/.blueprint/tasks.db',
        },
      ] as const

      for (const scenario of scenarios) {
        const fixture = await createFixtureDir()
        fixtures.push(fixture)
        await writeProgress(fixture.path, scenario.progress)
        if (scenario.tracker) {
          await writeTrackerDb(fixture.path)
        }

        const result = await execFileAsync('node', [scriptPath], {
          cwd: fixture.path,
        })

        expect(result.stdout).toContain(`## Progress State\n${scenario.expectedProgressState}`)
        expect(result.stdout).toContain(`## Tracker\n${scenario.expectedTrackerState}`)
        expectSectionsInOrder(result.stdout)
      }
    },
  )

  it.each(SCRIPT_PATHS)(
    'T-R12-1.0.3.2: %s reports supported-root marker states and legacy-migration origin distinctly from markerless backcompat',
    async (scriptPath) => {
      const migratedFixture = await createFixtureDir()
      fixtures.push(migratedFixture)
      await writeProgress(migratedFixture.path, POPULATED_PROGRESS)
      await writeTrackerDb(migratedFixture.path)
      await writeRootFile(migratedFixture.path, 'CLAUDE.md', [
        '# Claude',
        '<!-- blueprint-origin: legacy-migration -->',
        '<!-- blueprint-status: alignment-required -->',
      ])
      await writeRootFile(migratedFixture.path, 'AGENTS.md', [
        '# Agents',
        '<!-- blueprint-status: alignment-complete -->',
      ])
      await writeRootFile(migratedFixture.path, 'GEMINI.md', ['# Gemini'])

      const migrated = await execFileAsync('node', [scriptPath], {
        cwd: migratedFixture.path,
      })

      expect(migrated.stdout).toContain('- `CLAUDE.md`: alignment-required')
      expect(migrated.stdout).toContain('- `AGENTS.md`: alignment-complete')
      expect(migrated.stdout).toContain('- `GEMINI.md`: no marker')
      expect(migrated.stdout).toContain('- `QWEN.md`: missing')
      expect(migrated.stdout).toContain('legacy-migration marker present in `CLAUDE.md`')

      const backcompatFixture = await createFixtureDir()
      fixtures.push(backcompatFixture)
      await writeProgress(backcompatFixture.path, POPULATED_PROGRESS)
      await writeTrackerDb(backcompatFixture.path)
      await writeRootFile(backcompatFixture.path, 'CLAUDE.md', ['# Claude'])

      const backcompat = await execFileAsync('node', [scriptPath], {
        cwd: backcompatFixture.path,
      })

      expect(backcompat.stdout).toContain('- `CLAUDE.md`: no marker')
      expect(backcompat.stdout).toContain('no legacy-migration marker')
    },
  )

  it.each(SCRIPT_PATHS)(
    'T-R12-1.0.3.3: %s treats scaffolded project-progress template as empty shell instead of populated progress',
    async (scriptPath) => {
      const fixture = await createFixtureDir()
      fixtures.push(fixture)
      await writeProgress(fixture.path, await readFile(PROJECT_PROGRESS_TEMPLATE_PATH, 'utf-8'))
      await writeTrackerDb(fixture.path)

      const scaffolded = await execFileAsync('node', [scriptPath], {
        cwd: fixture.path,
      })

      expect(scaffolded.stdout).toContain('## Progress State\nempty progress shell')
      expect(scaffolded.stdout).toContain('## Pending Revisions\n_none_')
      expect(scaffolded.stdout).not.toContain('- ****')
      expect(scaffolded.stdout).toContain('## Tracker\ninitialised at docs/.blueprint/tasks.db')
    },
  )
})
