import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { invokeCli } from '../../helpers/cli'
import { renderCommandHelp } from '../../../src/help/command'
import {
  LEGACY_MIGRATION_MARKER,
  buildRootSetupBlock,
  writeSupportedRootFileFixture,
} from '../../revision-11/gate/helpers'

const tempDirs: string[] = []

async function makeProjectDir(prefix = 'blueprint-r12-4-stream-a-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  await mkdir(join(dir, 'docs', '.blueprint'), { recursive: true })
  return dir
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

describe('R12-4.A alignment-complete validation', () => {
  it('T-R12-4.A.1: validates already-complete marked files before flipping required markers', async () => {
    const projectDir = await makeProjectDir()

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      agentOrchestrationVariant: 'missing',
    })

    const beforeClaude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
    const beforeAgents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')

    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('AGENTS.md')
    expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe(beforeClaude)
    expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(beforeAgents)
  })

  it('T-R12-4.A.2.1: completes alignment for required, already-complete, markerless, absent, and legacy-origin file combinations', async () => {
    const projectDir = await makeProjectDir()

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      includeLegacyMigrationMarker: true,
      projectConventionsVariant: 'missing',
      agentOrchestrationVariant: 'missing',
    })

    const beforeGemini = await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')
    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(0)

    const claude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
    const agents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')
    const gemini = await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')

    expect(claude).toContain('alignment-complete')
    expect(claude).not.toContain('alignment-required')
    expect(claude).not.toContain(LEGACY_MIGRATION_MARKER)

    expect(agents).toContain('alignment-complete')
    expect(agents).not.toContain(LEGACY_MIGRATION_MARKER)

    expect(gemini).toBe(beforeGemini)
    expect(gemini).toContain(LEGACY_MIGRATION_MARKER)
    await expect(readFile(join(projectDir, 'QWEN.md'), 'utf-8')).rejects.toBeDefined()
  })

  it('T-R12-4.A.2.2: preserves markers and legacy-origin content when marked-file validation fails', async () => {
    const projectDir = await makeProjectDir()

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      includeLegacyMigrationMarker: true,
      projectConventionsVariant: 'missing',
    })

    const beforeClaude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
    const beforeAgents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')

    const result = await runAlignmentComplete(projectDir)

    expect(result.exitCode).toBe(1)
    expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe(beforeClaude)
    expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(beforeAgents)
    expect(beforeClaude).toContain(LEGACY_MIGRATION_MARKER)
    expect(beforeAgents).toContain(LEGACY_MIGRATION_MARKER)
  })

  it('T-R12-4.A.3: command output and help copy describe validation, no-partial flips, markerless repair guidance, absent-file skipping, and legacy-origin cleanup', async () => {
    const successProjectDir = await makeProjectDir('blueprint-r12-4-stream-a-success-copy-')

    await writeSupportedRootFileFixture(successProjectDir, 'CLAUDE.md', {
      markerState: 'required',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(successProjectDir, 'AGENTS.md', {
      markerState: 'complete',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(successProjectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventionsVariant: 'missing',
      agentOrchestrationVariant: 'missing',
    })

    const success = await runAlignmentComplete(successProjectDir)
    const help = renderCommandHelp('alignment-complete')

    expect(success.exitCode).toBe(0)
    expect(success.stdout).toContain('Validated marked files before any marker changes.')
    expect(success.stdout).toContain('Markerless supported files remain unchanged; repair them manually: GEMINI.md')
    expect(success.stdout).toContain('Skipped absent: QWEN.md')
    expect(success.stdout).toContain('Removed legacy-origin markers: CLAUDE.md, AGENTS.md')

    expect(help).toContain('Validates marked files before any marker changes')
    expect(help).toContain('fails without partial marker flips')
    expect(help).toContain('markerless supported files with repair guidance')
    expect(help).toContain('skips absent files')
    expect(help).toContain('legacy-migration origin markers')
  })

  it('T-R12-4.A.4.1: regression coverage proves mixed-state success, already-complete validation, markerless reporting, absent skipping, and legacy-origin cleanup', async () => {
    const projectDir = await makeProjectDir('blueprint-r12-4-stream-a-regression-success-')

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventionsVariant: 'missing',
      agentOrchestrationVariant: 'missing',
    })

    const firstRun = await runAlignmentComplete(projectDir)
    const secondRun = await runAlignmentComplete(projectDir)

    expect(firstRun.exitCode).toBe(0)
    expect(firstRun.stdout).toContain('Changed: CLAUDE.md')
    expect(firstRun.stdout).toContain('Already complete: AGENTS.md')
    expect(firstRun.stdout).toContain('Markerless supported files remain unchanged; repair them manually: GEMINI.md')
    expect(firstRun.stdout).toContain('Skipped absent: QWEN.md')
    expect(firstRun.stdout).toContain('Removed legacy-origin markers: CLAUDE.md, AGENTS.md')

    expect(secondRun.exitCode).toBe(0)
    expect(secondRun.stdout).not.toContain('Changed:')
    expect(secondRun.stdout).toContain('Already complete: CLAUDE.md, AGENTS.md')
    expect(secondRun.stdout).toContain('Markerless supported files remain unchanged; repair them manually: GEMINI.md')
    expect(secondRun.stdout).toContain('Skipped absent: QWEN.md')

    expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).not.toContain(LEGACY_MIGRATION_MARKER)
    expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).not.toContain(LEGACY_MIGRATION_MARKER)
  })

  it('T-R12-4.A.4.2: regression coverage rejects missing blocks, placeholder blocks, and mismatched ProjectConventions without partial writes', async () => {
    const sharedProjectConventions = buildRootSetupBlock('ProjectConventions', '  shared')
    const differentProjectConventions = buildRootSetupBlock('ProjectConventions', '  different')
    const validAgentOrchestration = buildRootSetupBlock('AgentOrchestration', '  orchestration')
    const cases: Array<{
      name: string
      expectedSnippet: string
      writeInvalidFixture: (projectDir: string) => Promise<void>
    }> = [
      {
        name: 'missing setup block',
        expectedSnippet: 'invalid <AgentOrchestration> block',
        writeInvalidFixture: async (projectDir) => {
          await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
            markerState: 'complete',
            agentOrchestrationVariant: 'missing',
          })
        },
      },
      {
        name: 'placeholder setup block',
        expectedSnippet: 'placeholder content `Alignment pending.` is not allowed',
        writeInvalidFixture: async (projectDir) => {
          await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
            markerState: 'complete',
            projectConventionsVariant: 'placeholder',
          })
        },
      },
      {
        name: 'mismatched ProjectConventions block',
        expectedSnippet: '<ProjectConventions> must be byte-identical to CLAUDE.md',
        writeInvalidFixture: async (projectDir) => {
          await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
            markerState: 'complete',
            projectConventions: differentProjectConventions,
            agentOrchestration: validAgentOrchestration,
          })
        },
      },
    ]

    for (const testCase of cases) {
      const projectDir = await makeProjectDir(`blueprint-r12-4-stream-a-regression-failure-${testCase.name.replaceAll(' ', '-')}-`)

      await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
        markerState: 'required',
        projectConventions: sharedProjectConventions,
        agentOrchestration: validAgentOrchestration,
        includeLegacyMigrationMarker: true,
      })
      await testCase.writeInvalidFixture(projectDir)

      const beforeClaude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
      const beforeAgents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')

      const result = await runAlignmentComplete(projectDir)

      expect(result.exitCode, testCase.name).toBe(1)
      expect(result.stderr, testCase.name).toContain('Blueprint alignment-complete failed: validation failed before any marker changes.')
      expect(result.stderr, testCase.name).toContain(testCase.expectedSnippet)
      expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8'), testCase.name).toBe(beforeClaude)
      expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8'), testCase.name).toBe(beforeAgents)
    }
  })
})
