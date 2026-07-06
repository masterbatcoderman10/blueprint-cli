import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { migrateCommand } from '../../../src/commands/r11-6-foundation'
import { runDoctorAudit } from '../../../src/doctor/audit'
import { pathExists } from '../../helpers/release'
import { invokeCli } from '../../helpers/cli'
import { __resetDeprecationBannerForTesting } from '../../../src/runtime/deprecation-banner'
import { assertLocalSkillPayloadMirror } from '../phase-5/helpers'
import { createGateProject, writeLegacyModeProject, writeSkillModeProject } from '../gate/helpers'

const tempDirs: string[] = []
const repoRoot = resolve(process.cwd())
const rootTemplateRoot = join(resolve(process.cwd()), 'templates', 'skill')
const skillPayloadTemplateRoot = join(resolve(process.cwd()), 'templates', 'skills', 'blueprint')
const skillInstallRoots = ['.claude/skills/blueprint', '.agents/skills/blueprint'] as const
const rootFiles = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const
const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'
const ALIGNMENT_COMPLETE_MARKER = '<!-- blueprint-status: alignment-complete -->'
const LEGACY_MIGRATION_MARKER = '<!-- blueprint-origin: legacy-migration -->'

let logSpy: ReturnType<typeof vi.spyOn> | undefined
let errorSpy: ReturnType<typeof vi.spyOn> | undefined

async function makeProjectDir(prefix = 'blueprint-r11-6-migrate-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function withCwd<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
  const originalCwd = process.cwd()
  process.chdir(cwd)

  try {
    return await fn()
  } finally {
    process.chdir(originalCwd)
  }
}

async function appendMarker(projectDir: string, fileName: (typeof rootFiles)[number], marker: string): Promise<void> {
  const filePath = join(projectDir, fileName)
  const content = await readFile(filePath, 'utf-8')
  const normalized = content.endsWith('\n') ? content : `${content}\n`
  await writeFile(filePath, `${normalized}${marker}\n`, 'utf-8')
}

async function replaceFile(projectDir: string, fileName: (typeof rootFiles)[number], content: string): Promise<void> {
  await writeFile(join(projectDir, fileName), content, 'utf-8')
}

async function expectedMigratedRootFile(fileName: (typeof rootFiles)[number]): Promise<string> {
  const template = await readFile(join(rootTemplateRoot, fileName), 'utf-8')
  return template.replace(
    ALIGNMENT_REQUIRED_MARKER,
    `${LEGACY_MIGRATION_MARKER}\n${ALIGNMENT_REQUIRED_MARKER}`,
  )
}

async function readManagedFiles(projectDir: string): Promise<string[]> {
  const manifest = JSON.parse(await readFile(join(projectDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')) as {
    managedFiles: string[]
  }

  return manifest.managedFiles
}

async function seedStaleSkillPayloadRoots(projectDir: string): Promise<void> {
  const claudeSkillRoot = join(projectDir, '.claude', 'skills', 'blueprint')
  const agentsSkillRoot = join(projectDir, '.agents', 'skills', 'blueprint')

  await rm(join(claudeSkillRoot, 'reference', 'align.md'), { force: true })
  await writeFile(join(claudeSkillRoot, 'reference', 'stale.md'), '# stale\n', 'utf-8')
  await writeFile(join(claudeSkillRoot, 'SKILL.md'), '# stale skill root\n', 'utf-8')

  await rm(join(agentsSkillRoot, 'scripts', 'load-context.mjs'), { force: true })
  await writeFile(join(agentsSkillRoot, 'reference', 'review.md'), '# drifted\n', 'utf-8')
  await writeFile(join(agentsSkillRoot, 'reference', 'extra.md'), '# extra\n', 'utf-8')
}

beforeEach(() => {
  __resetDeprecationBannerForTesting()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(async () => {
  __resetDeprecationBannerForTesting()
  logSpy?.mockRestore()
  errorSpy?.mockRestore()

  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-R11-6.B.1/B.2/B.3/B.4/B.5 migrate command', () => {
  it('migrates a legacy project in place, forces fresh alignment for every converted root file, removes docs/core, refreshes the manifest, and reports skill mode to Doctor', async () => {
    const project = await createGateProject()

    try {
      await writeLegacyModeProject(project.rootDir, { managedFiles: [...rootFiles] })
      await mkdir(join(project.rootDir, 'docs', '.blueprint'), { recursive: true })
      await appendMarker(project.rootDir, 'CLAUDE.md', ALIGNMENT_REQUIRED_MARKER)
      await appendMarker(project.rootDir, 'AGENTS.md', ALIGNMENT_COMPLETE_MARKER)
      await rm(join(project.rootDir, 'QWEN.md'), { force: true })

      const migrateResult = await withCwd(join(project.rootDir, 'docs'), async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )

      expect(migrateResult).toEqual({ exitCode: 0 })
      for (const skillBase of skillInstallRoots) {
        await assertLocalSkillPayloadMirror(skillPayloadTemplateRoot, join(project.rootDir, skillBase))
      }

      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toBe(
        await expectedMigratedRootFile('CLAUDE.md'),
      )
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toBe(
        await expectedMigratedRootFile('AGENTS.md'),
      )
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toBe(
        await expectedMigratedRootFile('GEMINI.md'),
      )
      expect(await pathExists(join(project.rootDir, 'QWEN.md'))).toBe(false)
      expect(await pathExists(join(project.rootDir, 'docs', 'core'))).toBe(false)
      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).not.toContain(ALIGNMENT_COMPLETE_MARKER)
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).not.toContain(ALIGNMENT_COMPLETE_MARKER)
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).not.toContain(ALIGNMENT_COMPLETE_MARKER)

      expect(await readManagedFiles(project.rootDir)).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])

      const doctorAudit = await runDoctorAudit(project.rootDir)
      expect(doctorAudit.mode).toBe('skill')

      __resetDeprecationBannerForTesting()
      const bannerSpy = vi.spyOn(
        await import('../../../src/runtime/deprecation-banner'),
        'emitDeprecationBanner',
      )
      const rerun = await withCwd(project.rootDir, async () => invokeCli(['migrate']))

      expect(rerun.exitCode).toBe(0)
      expect(bannerSpy).not.toHaveBeenCalled()
      bannerSpy.mockRestore()
    } finally {
      await project.cleanup()
    }
  })

  it('refreshes stale skill-mode payload roots, preserves already skill-mode root files, leaves non-legacy docs/core untouched, and realigns the manifest to the existing subset on rerun', async () => {
    const project = await createGateProject()

    try {
      await writeSkillModeProject(project.rootDir, { managedFiles: [...rootFiles] })
      await seedStaleSkillPayloadRoots(project.rootDir)
      await rm(join(project.rootDir, 'AGENTS.md'), { force: true })
      await rm(join(project.rootDir, 'QWEN.md'), { force: true })
      await mkdir(join(project.rootDir, 'docs', 'core'), { recursive: true })
      await writeFile(join(project.rootDir, 'docs', 'core', 'sentinel.md'), '# keep me\n', 'utf-8')
      await replaceFile(project.rootDir, 'CLAUDE.md', await readFile(join(repoRoot, 'CLAUDE.md'), 'utf-8'))
      await replaceFile(project.rootDir, 'GEMINI.md', await readFile(join(repoRoot, 'GEMINI.md'), 'utf-8'))

      const before = {
        claude: await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8'),
        gemini: await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8'),
        sentinel: await readFile(join(project.rootDir, 'docs', 'core', 'sentinel.md'), 'utf-8'),
      }

      const migrateResult = await withCwd(project.rootDir, async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )

      expect(migrateResult).toEqual({ exitCode: 0 })
      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toBe(before.claude)
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toBe(before.gemini)
      expect(await pathExists(join(project.rootDir, 'AGENTS.md'))).toBe(false)
      expect(await pathExists(join(project.rootDir, 'QWEN.md'))).toBe(false)
      expect(await readFile(join(project.rootDir, 'docs', 'core', 'sentinel.md'), 'utf-8')).toBe(before.sentinel)
      expect(await readManagedFiles(project.rootDir)).toEqual(['CLAUDE.md', 'GEMINI.md'])
      for (const skillBase of skillInstallRoots) {
        await assertLocalSkillPayloadMirror(skillPayloadTemplateRoot, join(project.rootDir, skillBase))
      }
    } finally {
      await project.cleanup()
    }
  })

  it('prints help and migrate output that describe forced fresh alignment and legacy-origin markers', async () => {
    const project = await createGateProject()

    try {
      await writeLegacyModeProject(project.rootDir, { managedFiles: ['CLAUDE.md'] })
      await mkdir(join(project.rootDir, 'docs', '.blueprint'), { recursive: true })

      const helpResult = await withCwd(project.rootDir, async () => invokeCli(['help', 'migrate']))
      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('forces fresh Alignment')
      expect(helpResult.stdout).toContain('legacy-migration')
      expect(helpResult.stdout).toContain('never preserves alignment-complete')
      expect(helpResult.stdout).toContain('Alignment workflow')

      const migrateResult = await withCwd(project.rootDir, async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )
      const migrateOutput = logSpy?.mock.calls.flatMap((args) => args.map((value) => String(value))).join('\n') ?? ''

      expect(migrateResult).toEqual({ exitCode: 0 })
      expect(migrateOutput).toContain('forces fresh Alignment')
      expect(migrateOutput).toContain('legacy-migration')
      expect(migrateOutput).toContain('never preserve `alignment-complete`')
      expect(migrateOutput).toContain('Alignment workflow')
    } finally {
      await project.cleanup()
    }
  })

  it('refreshes stale skill-mode payload roots on migrate rerun and restores the canonical payload', async () => {
    const project = await createGateProject()

    try {
      await writeSkillModeProject(project.rootDir, { managedFiles: [...rootFiles] })
      await seedStaleSkillPayloadRoots(project.rootDir)

      const migrateResult = await withCwd(project.rootDir, async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )

      expect(migrateResult).toEqual({ exitCode: 0 })
      for (const skillBase of skillInstallRoots) {
        await assertLocalSkillPayloadMirror(skillPayloadTemplateRoot, join(project.rootDir, skillBase))
      }
      expect(await pathExists(join(project.rootDir, 'docs', 'core'))).toBe(false)
    } finally {
      await project.cleanup()
    }
  })

  it('fails outside a Blueprint project with an actionable root error', async () => {
    const projectDir = await makeProjectDir()

    const result = await withCwd(projectDir, async () =>
      migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
    )

    expect(result).toEqual({ exitCode: 1 })
    expect(errorSpy).toHaveBeenCalledWith('not in a Blueprint project — run `blueprint init` here first')
  })
})
