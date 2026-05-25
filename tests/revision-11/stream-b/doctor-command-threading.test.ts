import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMissingStructureFinding } from '../../../src/doctor/findings'

const doctorCommandMocks = vi.hoisted(() => ({
  runDoctorAudit: vi.fn(),
  renderDoctorReport: vi.fn(() => 'doctor report'),
  createRepairPlan: vi.fn(),
  renderRepairPlan: vi.fn(() => 'repair plan'),
  executeRepairs: vi.fn(),
  renderRepairResult: vi.fn(() => 'repair result'),
  intro: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  log: {
    info: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../../../src/doctor/audit', () => ({
  runDoctorAudit: doctorCommandMocks.runDoctorAudit,
}))

vi.mock('../../../src/doctor/report', () => ({
  renderDoctorReport: doctorCommandMocks.renderDoctorReport,
}))

vi.mock('../../../src/doctor/repair', () => ({
  createRepairPlan: doctorCommandMocks.createRepairPlan,
  renderRepairPlan: doctorCommandMocks.renderRepairPlan,
}))

vi.mock('../../../src/doctor/executor', () => ({
  executeRepairs: doctorCommandMocks.executeRepairs,
  renderRepairResult: doctorCommandMocks.renderRepairResult,
}))

vi.mock('@clack/prompts', () => ({
  intro: doctorCommandMocks.intro,
  confirm: doctorCommandMocks.confirm,
  cancel: doctorCommandMocks.cancel,
  log: doctorCommandMocks.log,
}))

describe('T-R11-2.B.1.4: doctor command threads mode metadata into repair planning', () => {
  let originalCwd: string
  let projectDir: string

  beforeEach(async () => {
    originalCwd = process.cwd()
    projectDir = await realpath(await mkdtemp(join(tmpdir(), 'blueprint-r11-2-b-command-')))
    process.chdir(projectDir)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(projectDir, { recursive: true, force: true })
  })

  it('passes auditResult mode and skillBase to createRepairPlan exactly once', async () => {
    const { doctorCommand } = await import('../../../src/commands/doctor')
    const finding = createMissingStructureFinding('.claude/skills/blueprint/reference/align.md', 'file')
    const auditResult = {
      mode: 'skill' as const,
      skillBase: '.claude/skills/blueprint',
      findings: [finding],
      isClean: false,
      hasBlockingFindings: false,
    }

    doctorCommandMocks.runDoctorAudit.mockResolvedValue(auditResult)
    doctorCommandMocks.createRepairPlan.mockResolvedValue({
      actions: [],
      hasBlockingFindings: false,
    })

    const result = await doctorCommand.handler([])

    expect(result).toEqual({ exitCode: 0 })
    expect(doctorCommandMocks.createRepairPlan).toHaveBeenCalledTimes(1)
    expect(doctorCommandMocks.createRepairPlan).toHaveBeenCalledWith(
      auditResult.findings,
      projectDir,
      auditResult.mode,
      auditResult.skillBase,
    )
  })
})
