import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { invokeCli } from '../../helpers/cli'
import {
  alignmentCompleteCommand,
  listExistingSupportedRootAgentFiles,
  migrateBlueprintProject,
  migrateCommand,
  readAlignmentMarkerState,
} from '../../../src/commands/r11-6-foundation'
import { implementedCommands } from '../../../src/help/implemented-commands'
import { placeholderCommands } from '../../../src/commands'
import { renderCommandHelp } from '../../../src/help/command'
import { renderRootHelp } from '../../../src/help/root'
import { createGateProject, writeLegacyModeProject, writeMarkerState } from './helpers'

const tempDirs: string[] = []

async function makeProjectDir(prefix = 'blueprint-r11-6-command-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function runCliInProject(projectDir: string, argv: string[]) {
  const originalCwd = process.cwd()
  process.chdir(projectDir)

  try {
    return await invokeCli(argv)
  } finally {
    process.chdir(originalCwd)
  }
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R11-6.0.1 supported root agent file discovery', () => {
  it('returns only existing supported root files in deterministic order', async () => {
    const projectDir = await makeProjectDir()
    await writeFile(join(projectDir, 'AGENTS.md'), '# a\n', 'utf-8')
    await writeFile(join(projectDir, 'CLAUDE.md'), '# c\n', 'utf-8')
    await writeFile(join(projectDir, 'QWEN.md'), '# q\n', 'utf-8')

    await expect(listExistingSupportedRootAgentFiles(projectDir)).resolves.toEqual([
      { fileName: 'CLAUDE.md', path: join(projectDir, 'CLAUDE.md') },
      { fileName: 'AGENTS.md', path: join(projectDir, 'AGENTS.md') },
      { fileName: 'QWEN.md', path: join(projectDir, 'QWEN.md') },
    ])
  })

  it('returns explicit alignment marker states for required, complete, missing, and absent files', async () => {
    const projectDir = await makeProjectDir()
    await writeMarkerState(projectDir, 'CLAUDE.md', 'required')
    await writeMarkerState(projectDir, 'AGENTS.md', 'complete')
    await writeMarkerState(projectDir, 'GEMINI.md', 'missing-marker')

    await expect(readAlignmentMarkerState(join(projectDir, 'CLAUDE.md'))).resolves.toBe('required')
    await expect(readAlignmentMarkerState(join(projectDir, 'AGENTS.md'))).resolves.toBe('complete')
    await expect(readAlignmentMarkerState(join(projectDir, 'GEMINI.md'))).resolves.toBe('missing-marker')
    await expect(readAlignmentMarkerState(join(projectDir, 'QWEN.md'))).resolves.toBe('absent')
  })
})

describe('R11-6.0.2 skill-mode migration helpers', () => {
  it('migrates a legacy project into both skill roots, forces fresh alignment-required markers, removes docs/core, and bootstraps the manifest', async () => {
    const project = await createGateProject()

    try {
      await writeLegacyModeProject(project.rootDir, { managedFiles: ['CLAUDE.md', 'AGENTS.md'] })
      await writeMarkerState(project.rootDir, 'CLAUDE.md', 'required')
      await writeMarkerState(project.rootDir, 'AGENTS.md', 'complete')
      await writeMarkerState(project.rootDir, 'GEMINI.md', 'missing-marker')
      await rm(join(project.rootDir, 'QWEN.md'), { force: true })

      const result = await migrateBlueprintProject(project.rootDir)

      expect(result.installedSkillRoots).toEqual([
        '.claude/skills/blueprint',
        '.agents/skills/blueprint',
      ])
      expect(result.convertedRootFiles).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])
      expect(result.manifestManagedFiles).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])
      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toContain('alignment-required')
      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toContain('blueprint-origin: legacy-migration')
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toContain('alignment-required')
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toContain('blueprint-origin: legacy-migration')
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toContain('alignment-required')
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toContain('blueprint-origin: legacy-migration')
      expect(await readAlignmentMarkerState(join(project.rootDir, 'QWEN.md'))).toBe('absent')
      expect(await readFile(join(project.rootDir, '.claude', 'skills', 'blueprint', 'SKILL.md'), 'utf-8')).toContain('blueprint')
      expect(await readFile(join(project.rootDir, '.agents', 'skills', 'blueprint', 'SKILL.md'), 'utf-8')).toContain('blueprint')
      expect(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')).toContain('"managedFiles"')
      expect(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')).toContain('"CLAUDE.md"')
      expect(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')).toContain('"AGENTS.md"')
      expect(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')).toContain('"GEMINI.md"')
      await expect(
        import('node:fs/promises').then(({ access }) => access(join(project.rootDir, 'docs', 'core'))),
      ).rejects.toBeDefined()
    } finally {
      await project.cleanup()
    }
  })
})

describe('R11-6.0.3 command registration and help summaries', () => {
  it('exports alignment-complete and migrate through runtime registration and help metadata', async () => {
    const projectDir = await makeProjectDir()
    await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })

    const rootHelp = await runCliInProject(projectDir, [])
    const alignmentHelp = await runCliInProject(projectDir, ['alignment-complete', '--help'])
    const migrateHelp = await runCliInProject(projectDir, ['migrate', '--help'])
    const alignmentRun = await runCliInProject(projectDir, ['alignment-complete'])
    const migrateRun = await runCliInProject(projectDir, ['migrate'])

    expect(alignmentCompleteCommand.name).toBe('alignment-complete')
    expect(migrateCommand.name).toBe('migrate')
    expect(placeholderCommands.map((command) => command.name)).toEqual(
      expect.arrayContaining(['alignment-complete', 'migrate']),
    )
    expect(implementedCommands.map((command) => command.name)).toEqual(
      expect.arrayContaining(['alignment-complete', 'migrate']),
    )
    expect(renderRootHelp()).toContain('alignment-complete')
    expect(renderRootHelp()).toContain('migrate')
    expect(renderRootHelp()).toContain(
      '  alignment-complete  Validate marked supported root agent files; no partial marker flips.',
    )
    expect(renderRootHelp()).toContain(
      '  migrate             Migrate a Blueprint project to skill mode; force fresh Alignment and never preserve alignment-complete.',
    )
    expect(renderCommandHelp('alignment-complete')).toContain('alignment-complete')
    expect(renderCommandHelp('migrate')).toContain('migrate')
    expect(rootHelp.stdout).toContain('alignment-complete')
    expect(rootHelp.stdout).toContain('migrate')
    expect(rootHelp.stdout).toContain('Validate marked supported root agent files; no partial marker flips.')
    expect(rootHelp.stdout).toContain(
      'Migrate a Blueprint project to skill mode; force fresh Alignment and never preserve alignment-complete.',
    )
    expect(alignmentHelp.stdout).toContain('alignment-complete')
    expect(migrateHelp.stdout).toContain('migrate')
    expect(alignmentRun.exitCode).toBe(0)
    expect(migrateRun.exitCode).toBe(0)
  })
})
