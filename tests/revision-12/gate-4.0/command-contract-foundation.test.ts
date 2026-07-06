import { mkdtemp } from 'node:fs/promises'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  extractRequiredRootSetupBlock,
  type RootSetupBlockName,
  validateAlignmentCompletionRootFiles,
} from '../../../src/commands/root-entry-point-setup'
import { runAlignmentCompletionPlumbing } from '../../../src/commands/r11-6-foundation'
import {
  LEGACY_MIGRATION_MARKER,
  buildRootSetupBlock,
  writeSupportedRootFileFixture,
} from '../../revision-11/gate/helpers'

function makeBlock(tagName: RootSetupBlockName, body: string): string {
  return buildRootSetupBlock(tagName, body)
}

const tempDirs: string[] = []

async function makeProjectDir(prefix = 'blueprint-r12-4-gate-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  await mkdir(join(dir, 'docs', '.blueprint'), { recursive: true })
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R12-4.0 command contract foundation', () => {
  it('T-R12-4.0.1.1: extracts complete ProjectConventions and AgentOrchestration blocks byte-for-byte with simple delimiter scanning', () => {
    const projectConventions = makeBlock(
      'ProjectConventions',
      [
        '  alpha',
        '    beta',
        '  gamma',
      ].join('\n'),
    )
    const agentOrchestration = makeBlock(
      'AgentOrchestration',
      [
        '  - One',
        '  - Two',
      ].join('\n'),
    )
    const content = [
      '# Blueprint',
      '',
      projectConventions,
      '',
      'Between blocks',
      '',
      agentOrchestration,
      '',
      '<!-- blueprint-status: alignment-required -->',
    ].join('\n')

    const extractedProjectConventions = extractRequiredRootSetupBlock(
      'CLAUDE.md',
      content,
      'ProjectConventions',
    )
    const extractedAgentOrchestration = extractRequiredRootSetupBlock(
      'CLAUDE.md',
      content,
      'AgentOrchestration',
    )

    expect(extractedProjectConventions).toEqual({
      ok: true,
      block: projectConventions,
    })
    expect(extractedAgentOrchestration).toEqual({
      ok: true,
      block: agentOrchestration,
    })
  })

  it('T-R12-4.0.1.2: rejects missing tags, reversed or duplicated malformed boundaries, and Alignment pending. placeholder content', () => {
    const cases: Array<{
      name: string
      tagName: RootSetupBlockName
      content: string
      code:
        | 'missing_open_tag'
        | 'missing_close_tag'
        | 'out_of_order_tags'
        | 'duplicate_open_tag'
        | 'duplicate_close_tag'
        | 'placeholder_content'
    }> = [
      {
        name: 'missing opening tag',
        tagName: 'ProjectConventions',
        content: 'prefix\n</ProjectConventions>\n',
        code: 'missing_open_tag',
      },
      {
        name: 'missing closing tag',
        tagName: 'ProjectConventions',
        content: '<ProjectConventions>\nprefix\n',
        code: 'missing_close_tag',
      },
      {
        name: 'reversed boundaries',
        tagName: 'AgentOrchestration',
        content: '</AgentOrchestration>\n<AgentOrchestration>\nbody\n',
        code: 'out_of_order_tags',
      },
      {
        name: 'duplicated opening tag before closing tag',
        tagName: 'ProjectConventions',
        content: '<ProjectConventions>\nfirst\n<ProjectConventions>\nsecond\n</ProjectConventions>\n',
        code: 'duplicate_open_tag',
      },
      {
        name: 'duplicated closing tag after the block',
        tagName: 'AgentOrchestration',
        content: '<AgentOrchestration>\nbody\n</AgentOrchestration>\n</AgentOrchestration>\n',
        code: 'duplicate_close_tag',
      },
      {
        name: 'dangling duplicated opening tag after a complete block',
        tagName: 'ProjectConventions',
        content: '<ProjectConventions>\nbody\n</ProjectConventions>\n<ProjectConventions>\n',
        code: 'duplicate_open_tag',
      },
      {
        name: 'placeholder content',
        tagName: 'ProjectConventions',
        content: '<ProjectConventions>\nAlignment pending.\n</ProjectConventions>\n',
        code: 'placeholder_content',
      },
    ]

    for (const testCase of cases) {
      const result = extractRequiredRootSetupBlock('AGENTS.md', testCase.content, testCase.tagName)

      expect(result, testCase.name).toEqual({
        ok: false,
        failure: {
          fileName: 'AGENTS.md',
          blockName: testCase.tagName,
          code: testCase.code,
          message: expect.stringContaining('AGENTS.md'),
        },
      })
    }
  })

  it('T-R12-4.0.2.1: classifies supported root files into required, already-complete, markerless, and absent groups', async () => {
    const projectDir = await makeProjectDir()
    const validProjectConventions = makeBlock('ProjectConventions', '  shared')
    const validAgentOrchestration = makeBlock('AgentOrchestration', '  orchestration')

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      projectConventions: validProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      projectConventions: validProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(projectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventionsVariant: 'missing',
      agentOrchestrationVariant: 'missing',
      extraBodyLines: ['markerless and intentionally missing required setup blocks'],
    })

    const result = await validateAlignmentCompletionRootFiles(projectDir)

    expect(result.required.map((entry) => entry.fileName)).toEqual(['CLAUDE.md'])
    expect(result.alreadyComplete.map((entry) => entry.fileName)).toEqual(['AGENTS.md'])
    expect(result.markerless.map((entry) => entry.fileName)).toEqual(['GEMINI.md'])
    expect(result.absent.map((entry) => entry.fileName)).toEqual(['QWEN.md'])
    expect(result.failures).toEqual([])
  })

  it('T-R12-4.0.2.2: enforces byte-identical ProjectConventions across marked files only', async () => {
    const matchingProjectDir = await makeProjectDir('blueprint-r12-4-match-')
    const sharedProjectConventions = makeBlock('ProjectConventions', '  shared')
    const differentProjectConventions = makeBlock('ProjectConventions', '  different')
    const validAgentOrchestration = makeBlock('AgentOrchestration', '  orchestration')

    await writeSupportedRootFileFixture(matchingProjectDir, 'CLAUDE.md', {
      markerState: 'required',
      projectConventions: sharedProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(matchingProjectDir, 'AGENTS.md', {
      markerState: 'complete',
      projectConventions: sharedProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(matchingProjectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventions: differentProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })

    const matchingResult = await validateAlignmentCompletionRootFiles(matchingProjectDir)
    expect(matchingResult.failures).toEqual([])

    const mismatchedProjectDir = await makeProjectDir('blueprint-r12-4-mismatch-')
    await writeSupportedRootFileFixture(mismatchedProjectDir, 'CLAUDE.md', {
      markerState: 'required',
      projectConventions: sharedProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(mismatchedProjectDir, 'AGENTS.md', {
      markerState: 'complete',
      projectConventions: differentProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(mismatchedProjectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventions: sharedProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })

    const mismatchedResult = await validateAlignmentCompletionRootFiles(mismatchedProjectDir)

    expect(mismatchedResult.failures).toEqual([
      {
        fileName: 'AGENTS.md',
        blockName: 'ProjectConventions',
        code: 'project_conventions_mismatch',
        message: expect.stringContaining('AGENTS.md'),
      },
    ])
    expect(mismatchedResult.failures.some((failure) => failure.fileName === 'GEMINI.md')).toBe(false)
    await expect(readFile(join(mismatchedProjectDir, 'QWEN.md'), 'utf-8')).rejects.toBeDefined()
  })

  it('T-R12-4.0.2.3: still reports a ProjectConventions mismatch when the same marked file also has an AgentOrchestration error', async () => {
    const projectDir = await makeProjectDir('blueprint-r12-4-mismatch-plus-other-error-')
    const sharedProjectConventions = makeBlock('ProjectConventions', '  shared')
    const differentProjectConventions = makeBlock('ProjectConventions', '  different')
    const validAgentOrchestration = makeBlock('AgentOrchestration', '  orchestration')

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      projectConventions: sharedProjectConventions,
      agentOrchestration: validAgentOrchestration,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      projectConventions: differentProjectConventions,
      agentOrchestrationVariant: 'missing',
    })

    const result = await validateAlignmentCompletionRootFiles(projectDir)

    expect(result.failures).toEqual(
      expect.arrayContaining([
        {
          fileName: 'AGENTS.md',
          blockName: 'AgentOrchestration',
          code: 'missing_open_tag',
          message: expect.stringContaining('AGENTS.md'),
        },
        {
          fileName: 'AGENTS.md',
          blockName: 'ProjectConventions',
          code: 'project_conventions_mismatch',
          message: expect.stringContaining('AGENTS.md'),
        },
      ]),
    )
  })

  it('T-R12-4.0.4: command fixture helpers create valid, missing, placeholder, mismatched, markerless, absent, and legacy-origin root-file scenarios without duplicated setup', async () => {
    const projectDir = await makeProjectDir('blueprint-r12-4-fixtures-')

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'complete',
      projectConventionsVariant: 'placeholder',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'GEMINI.md', {
      markerState: 'missing-marker',
      projectConventions: buildRootSetupBlock('ProjectConventions', '  mismatched'),
      agentOrchestrationVariant: 'missing',
    })
    await writeSupportedRootFileFixture(projectDir, 'QWEN.md', {
      markerState: 'absent',
    })

    const claude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
    const agents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')
    const gemini = await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')

    expect(claude).toContain('<ProjectConventions>')
    expect(claude).toContain('<AgentOrchestration>')
    expect(claude).toContain('alignment-required')

    expect(agents).toContain('Alignment pending.')
    expect(agents).toContain(LEGACY_MIGRATION_MARKER)
    expect(agents).toContain('alignment-complete')

    expect(gemini).toContain('<ProjectConventions>')
    expect(gemini).not.toContain('<AgentOrchestration>')
    expect(gemini).not.toContain('alignment-required')
    expect(gemini).not.toContain('alignment-complete')

    await expect(readFile(join(projectDir, 'QWEN.md'), 'utf-8')).rejects.toBeDefined()
  })

  it('T-R12-4.0.3.1: collects all validation failures before mutation and renders file-specific warnings', async () => {
    const projectDir = await makeProjectDir('blueprint-r12-4-no-partial-write-')

    await writeSupportedRootFileFixture(projectDir, 'CLAUDE.md', {
      markerState: 'required',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'AGENTS.md', {
      markerState: 'required',
      projectConventionsVariant: 'placeholder',
      includeLegacyMigrationMarker: true,
    })
    await writeSupportedRootFileFixture(projectDir, 'GEMINI.md', {
      markerState: 'complete',
      includeLegacyMigrationMarker: true,
    })

    const before = {
      claude: await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8'),
      agents: await readFile(join(projectDir, 'AGENTS.md'), 'utf-8'),
      gemini: await readFile(join(projectDir, 'GEMINI.md'), 'utf-8'),
    }

    const result = await runAlignmentCompletionPlumbing(projectDir)

    expect(result.changed).toEqual([])
    expect(result.failed).toEqual([
      {
        fileName: 'AGENTS.md',
        blockName: 'ProjectConventions',
        code: 'placeholder_content',
        message: expect.stringContaining('AGENTS.md'),
      },
    ])
    expect(result.warnings).toEqual([expect.stringContaining('AGENTS.md')])
    expect(result.legacyOriginCleaned).toEqual([])

    expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe(before.claude)
    expect(await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(before.agents)
    expect(await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')).toBe(before.gemini)
  })

  it('T-R12-4.0.3.2: exposes explicit changed, already-complete, markerless, skipped, failed, and legacy-origin-cleaned result shapes', async () => {
    const projectDir = await makeProjectDir('blueprint-r12-4-result-shapes-')

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
    })
    await writeSupportedRootFileFixture(projectDir, 'QWEN.md', {
      markerState: 'absent',
    })

    const result = await runAlignmentCompletionPlumbing(projectDir)

    expect(result.changed).toEqual(['CLAUDE.md'])
    expect(result.alreadyComplete).toEqual(['AGENTS.md'])
    expect(result.markerless).toEqual(['GEMINI.md'])
    expect(result.skipped).toEqual(['QWEN.md'])
    expect(result.failed).toEqual([])
    expect(result.legacyOriginCleaned).toEqual(['CLAUDE.md', 'AGENTS.md'])
    expect(result.warnings).toEqual([])

    const claude = await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')
    const agents = await readFile(join(projectDir, 'AGENTS.md'), 'utf-8')
    const gemini = await readFile(join(projectDir, 'GEMINI.md'), 'utf-8')

    expect(claude).toContain('alignment-complete')
    expect(claude).not.toContain('alignment-required')
    expect(claude).not.toContain(LEGACY_MIGRATION_MARKER)

    expect(agents).toContain('alignment-complete')
    expect(agents).not.toContain(LEGACY_MIGRATION_MARKER)

    expect(gemini).not.toContain('alignment-required')
    expect(gemini).not.toContain('alignment-complete')
  })
})
