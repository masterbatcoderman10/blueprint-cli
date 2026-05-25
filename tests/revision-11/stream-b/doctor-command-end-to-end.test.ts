import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createDriftedFileFinding,
  createMissingStructureFinding,
  type DoctorAuditResult,
} from '../../../src/doctor/findings'
import { resolveTemplatePath } from '../../../src/doctor/inventory'
import { invokeCli } from '../../helpers/cli'

const doctorE2eMocks = vi.hoisted(() => ({
  runDoctorAudit: vi.fn(),
  renderDoctorReport: vi.fn((result: DoctorAuditResult) => {
    const lines = [`Mode: ${result.mode}`]

    if (result.isClean) {
      lines.push('Blueprint Doctor: no integrity findings. Project is aligned with bundled templates.')
      return lines.join('\n')
    }

    lines.push('Blueprint Doctor found integrity issues:')
    for (const finding of result.findings) {
      lines.push(`${finding.kind}: ${finding.targetPath}`)
    }

    return lines.join('\n')
  }),
  intro: vi.fn((message: string) => {
    process.stdout.write(`${message}\n`)
  }),
  confirm: vi.fn(() => Promise.resolve(true)),
  cancel: vi.fn((message: string) => {
    process.stdout.write(`${message}\n`)
  }),
  log: {
    info: vi.fn((message: string) => {
      process.stdout.write(`${message}\n`)
    }),
    message: vi.fn((message: string) => {
      process.stdout.write(`${message}\n`)
    }),
    success: vi.fn((message: string) => {
      process.stdout.write(`${message}\n`)
    }),
    warn: vi.fn((message: string) => {
      process.stdout.write(`${message}\n`)
    }),
  },
}))

vi.mock('../../../src/doctor/audit', () => ({
  runDoctorAudit: doctorE2eMocks.runDoctorAudit,
}))

vi.mock('../../../src/doctor/report', () => ({
  renderDoctorReport: doctorE2eMocks.renderDoctorReport,
}))

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>()
  return {
    ...actual,
    intro: doctorE2eMocks.intro,
    confirm: doctorE2eMocks.confirm,
    cancel: doctorE2eMocks.cancel,
    log: doctorE2eMocks.log,
  }
})

describe('T-R11-2.B.1 doctor command end-to-end repair mode scenarios', () => {
  const tempDirs: string[] = []
  const skillBase = '.claude/skills/blueprint'
  const alignPath = `${skillBase}/reference/align.md`

  afterEach(async () => {
    vi.clearAllMocks()

    for (const dir of tempDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true })
    }
  })

  async function makeSkillProject(): Promise<string> {
    const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r11-2-b-doctor-e2e-'))
    tempDirs.push(projectDir)

    await mkdir(join(projectDir, `${skillBase}/reference`), { recursive: true })
    await writeFile(join(projectDir, `${skillBase}/SKILL.md`), '# Blueprint Skill\n', 'utf-8')
    return projectDir
  }

  async function runDoctorIn(projectDir: string) {
    const originalCwd = process.cwd()
    process.chdir(projectDir)

    try {
      return await invokeCli(['doctor'])
    } finally {
      process.chdir(originalCwd)
    }
  }

  it('T-R11-2.B.1.5 repairs a missing non-root skill canonical file through the doctor command', async () => {
    const projectDir = await makeSkillProject()
    const missingFinding = createMissingStructureFinding(alignPath, 'file')
    const firstAudit: DoctorAuditResult = {
      mode: 'skill',
      skillBase,
      findings: [missingFinding],
      isClean: false,
      hasBlockingFindings: false,
    }
    const cleanAudit: DoctorAuditResult = {
      mode: 'skill',
      skillBase,
      findings: [],
      isClean: true,
      hasBlockingFindings: false,
    }

    doctorE2eMocks.runDoctorAudit.mockResolvedValueOnce(firstAudit).mockResolvedValueOnce(cleanAudit)

    const result = await runDoctorIn(projectDir)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Mode: skill')
    expect(result.stdout).toContain('Proposed repairs:')
    expect(result.stdout).toContain('Create missing file from template: .claude/skills/blueprint/reference/align.md')
    expect(result.stdout).toContain('Successfully applied 1 repair(s).')
    expect(result.stdout).toContain('Project integrity is now clean. All repairs successful.')
    expect(doctorE2eMocks.runDoctorAudit).toHaveBeenCalledTimes(2)

    const repairedContent = await readFile(join(projectDir, alignPath), 'utf-8')
    const templateContent = await readFile(resolveTemplatePath(alignPath), 'utf-8')
    expect(repairedContent).toBe(templateContent)
  })

  it('T-R11-2.B.1.6 reports drifted skill canonical files without overwriting them through the doctor command', async () => {
    const projectDir = await makeSkillProject()
    const driftedContent = '# Locally customized alignment instructions\n'
    await writeFile(join(projectDir, alignPath), driftedContent, 'utf-8')

    const firstAudit: DoctorAuditResult = {
      mode: 'skill',
      skillBase,
      findings: [createDriftedFileFinding(alignPath)],
      isClean: false,
      hasBlockingFindings: false,
    }

    doctorE2eMocks.runDoctorAudit.mockResolvedValueOnce(firstAudit)

    const result = await runDoctorIn(projectDir)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Mode: skill')
    expect(result.stdout).toContain('drifted-file: .claude/skills/blueprint/reference/align.md')
    expect(result.stdout).toContain('No repairs needed for the detected findings.')
    expect(result.stdout).not.toContain('Successfully applied')
    expect(doctorE2eMocks.runDoctorAudit).toHaveBeenCalledTimes(1)

    await expect(readFile(join(projectDir, alignPath), 'utf-8')).resolves.toBe(driftedContent)
  })
})
