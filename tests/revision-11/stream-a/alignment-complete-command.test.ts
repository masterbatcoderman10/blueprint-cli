import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { invokeCli } from '../../helpers/cli'
import { renderCommandHelp } from '../../../src/help/command'
import { writeMarkerState } from '../gate/helpers'

const tempDirs: string[] = []

async function makeProjectDir(prefix = 'blueprint-r11-6-alignment-complete-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function makeAlignmentProject(
  states: Array<[string, 'required' | 'complete' | 'missing-marker' | 'absent']>,
): Promise<string> {
  const projectDir = await makeProjectDir()
  await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })

  for (const [fileName, state] of states) {
    await writeMarkerState(projectDir, fileName, state)
  }

  return projectDir
}

async function runAlignmentComplete(projectDir: string) {
  const originalCwd = process.cwd()
  process.chdir(projectDir)

  try {
    return await invokeCli(['alignment-complete'])
  } finally {
    process.chdir(originalCwd)
  }
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R11-6.A.1 alignment-complete command behavior', () => {
  it('rewrites every required marker in supported root files and reports the change set', async () => {
    const projectDir = await makeAlignmentProject([
      ['CLAUDE.md', 'required'],
      ['AGENTS.md', 'required'],
      ['GEMINI.md', 'required'],
      ['QWEN.md', 'required'],
    ])

    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Changed: CLAUDE.md, AGENTS.md, GEMINI.md, QWEN.md')
    expect(result.stdout).not.toContain('Already complete:')
    expect(result.stdout).not.toContain('Missing marker:')
    expect(result.stdout).not.toContain('Skipped absent:')

    for (const fileName of ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const) {
      const content = await readFile(join(projectDir, fileName), 'utf-8')
      expect(content).toContain('alignment-complete')
      expect(content).not.toContain('alignment-required')
    }
  })

  it('reports already-complete files on a rerun without changing their contents', async () => {
    const projectDir = await makeAlignmentProject([
      ['CLAUDE.md', 'required'],
      ['AGENTS.md', 'required'],
      ['GEMINI.md', 'required'],
      ['QWEN.md', 'required'],
    ])

    const firstRun = await runAlignmentComplete(projectDir)
    expect(firstRun.exitCode).toBe(0)

    const before = {
      CLAUDE: await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8'),
      AGENTS: await readFile(join(projectDir, 'AGENTS.md'), 'utf-8'),
      GEMINI: await readFile(join(projectDir, 'GEMINI.md'), 'utf-8'),
      QWEN: await readFile(join(projectDir, 'QWEN.md'), 'utf-8'),
    }

    const secondRun = await runAlignmentComplete(projectDir)

    expect(secondRun.exitCode).toBe(0)
    expect(secondRun.stdout).toContain('Already complete: CLAUDE.md, AGENTS.md, GEMINI.md, QWEN.md')
    expect(secondRun.stdout).not.toContain('Changed:')
    expect(secondRun.stdout).not.toContain('Missing marker:')
    expect(secondRun.stdout).not.toContain('Skipped absent:')

    expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe(before.CLAUDE)
    expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(before.AGENTS)
    expect(await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')).toBe(before.GEMINI)
    expect(await readFile(join(projectDir, 'QWEN.md'), 'utf-8')).toBe(before.QWEN)
  })

  it('reports markerless and absent supported files without changing them', async () => {
    const projectDir = await makeAlignmentProject([
      ['CLAUDE.md', 'required'],
      ['AGENTS.md', 'required'],
      ['GEMINI.md', 'missing-marker'],
      ['QWEN.md', 'absent'],
    ])

    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Changed: CLAUDE.md, AGENTS.md')
    expect(result.stdout).toContain('Missing marker: GEMINI.md')
    expect(result.stdout).toContain('Skipped absent: QWEN.md')

    expect(await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')).not.toContain('alignment-complete')
    expect(await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')).not.toContain('alignment-required')
    await expect(readFile(join(projectDir, 'QWEN.md'), 'utf-8')).rejects.toBeDefined()
  })

  it('fails outside a Blueprint project with an actionable project-root error', async () => {
    const projectDir = await makeProjectDir()

    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('Blueprint alignment-complete failed:')
    expect(result.stderr).toContain('blueprint init')
  })
})

describe('R11-6.A.2 alignment-complete help copy', () => {
  it('documents changed, already-complete, missing-marker, skipped, and outside-project outcomes', () => {
    const help = renderCommandHelp('alignment-complete')

    expect(help).toContain('Usage: blueprint alignment-complete')
    expect(help).toContain('Rewrites alignment-required markers to alignment-complete')
    expect(help).toContain('already-complete')
    expect(help).toContain('missing-marker')
    expect(help).toContain('skips absent files')
    expect(help).toContain('outside a Blueprint project')
  })
})
