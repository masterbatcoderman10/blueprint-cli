import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { migrateCommand } from '../../../src/commands/r11-6-foundation'
import { runDoctorAudit } from '../../../src/doctor/audit'
import { pathExists } from '../../helpers/release'
import { runCli } from '../../../src/index'
import { __resetDeprecationBannerForTesting } from '../../../src/runtime/deprecation-banner'
import { assertLocalSkillPayloadMirror } from '../phase-5/helpers'
import { createGateProject, writeLegacyModeProject, writeSkillModeProject } from '../gate/helpers'

const tempDirs: string[] = []
const rootTemplateRoot = join(resolve(process.cwd()), 'templates', 'skill')
const skillPayloadTemplateRoot = join(resolve(process.cwd()), 'templates', 'skills', 'blueprint')
const skillInstallRoots = ['.claude/skills/blueprint', '.agents/skills/blueprint'] as const
const rootFiles = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

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
  it('migrates a legacy project in place, preserves marker state, installs both skill roots, removes docs/core, refreshes the manifest, and reports skill mode to Doctor', async () => {
    const project = await createGateProject()

    try {
      await writeLegacyModeProject(project.rootDir, { managedFiles: [...rootFiles] })
      await mkdir(join(project.rootDir, 'docs', '.blueprint'), { recursive: true })
      await appendMarker(project.rootDir, 'CLAUDE.md', '<!-- blueprint-status: alignment-required -->')
      await appendMarker(project.rootDir, 'AGENTS.md', '<!-- blueprint-status: alignment-complete -->')
      await appendMarker(project.rootDir, 'GEMINI.md', '<!-- blueprint-status: alignment-required -->')
      await rm(join(project.rootDir, 'QWEN.md'), { force: true })

      const migrateResult = await withCwd(join(project.rootDir, 'docs'), async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )

      expect(migrateResult).toEqual({ exitCode: 0 })
      for (const skillBase of skillInstallRoots) {
        await assertLocalSkillPayloadMirror(skillPayloadTemplateRoot, join(project.rootDir, skillBase))
      }

      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toBe(
        `${await readFile(join(rootTemplateRoot, 'CLAUDE.md'), 'utf-8')}<!-- blueprint-status: alignment-required -->\n`,
      )
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toBe(
        `${await readFile(join(rootTemplateRoot, 'AGENTS.md'), 'utf-8')}<!-- blueprint-status: alignment-complete -->\n`,
      )
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toBe(
        `${await readFile(join(rootTemplateRoot, 'GEMINI.md'), 'utf-8')}<!-- blueprint-status: alignment-required -->\n`,
      )
      expect(await pathExists(join(project.rootDir, 'QWEN.md'))).toBe(false)
      expect(await pathExists(join(project.rootDir, 'docs', 'core'))).toBe(false)

      const manifest = JSON.parse(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')) as {
        managedFiles: string[]
      }
      expect(manifest.managedFiles).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])

      const doctorAudit = await runDoctorAudit(project.rootDir)
      expect(doctorAudit.mode).toBe('skill')

      __resetDeprecationBannerForTesting()
      const bannerSpy = vi.spyOn(
        await import('../../../src/runtime/deprecation-banner'),
        'emitDeprecationBanner',
      )
      const rerun = await withCwd(project.rootDir, async () => runCli(['migrate']))

      expect(rerun).toBe(0)
      expect(bannerSpy).not.toHaveBeenCalled()
      bannerSpy.mockRestore()
    } finally {
      await project.cleanup()
    }
  })

  it('leaves an already skill-mode project unchanged on rerun', async () => {
    const project = await createGateProject()

    try {
      await writeSkillModeProject(project.rootDir, { managedFiles: [...rootFiles] })
      await appendMarker(project.rootDir, 'CLAUDE.md', '<!-- blueprint-status: alignment-required -->')
      await appendMarker(project.rootDir, 'AGENTS.md', '<!-- blueprint-status: alignment-required -->')
      await appendMarker(project.rootDir, 'GEMINI.md', '<!-- blueprint-status: alignment-complete -->')
      await appendMarker(project.rootDir, 'QWEN.md', '<!-- blueprint-status: alignment-required -->')

      const before = {
        claude: await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8'),
        agents: await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8'),
        gemini: await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8'),
        qwen: await readFile(join(project.rootDir, 'QWEN.md'), 'utf-8'),
        manifest: await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8'),
      }

      const migrateResult = await withCwd(project.rootDir, async () =>
        migrateCommand.handler({ commandName: 'migrate', args: [], rawArgv: ['migrate'] }),
      )

      expect(migrateResult).toEqual({ exitCode: 0 })
      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toBe(before.claude)
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toBe(before.agents)
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).toBe(before.gemini)
      expect(await readFile(join(project.rootDir, 'QWEN.md'), 'utf-8')).toBe(before.qwen)
      expect(await readFile(join(project.rootDir, 'docs', '.blueprint', 'manifest.json'), 'utf-8')).toBe(before.manifest)
      expect(await pathExists(join(project.rootDir, 'docs', 'core'))).toBe(false)
      for (const skillBase of skillInstallRoots) {
        await assertLocalSkillPayloadMirror(skillPayloadTemplateRoot, join(project.rootDir, skillBase))
      }
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
