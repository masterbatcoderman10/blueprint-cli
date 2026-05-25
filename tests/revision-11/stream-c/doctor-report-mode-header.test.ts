import { describe, expect, it } from 'vitest'

import { createMissingStructureFinding } from '../../../src/doctor/findings'
import { renderDoctorReport } from '../../../src/doctor/report'

describe('R11-2.C.1: Doctor report mode header', () => {
  it('T-R11-2.C.1.1: prepends Mode: skill for clean and findings-present reports', () => {
    const cleanReport = renderDoctorReport({
      mode: 'skill',
      skillBase: '.claude/skills/blueprint',
      findings: [],
      isClean: true,
      hasBlockingFindings: false,
    })
    const findingsReport = renderDoctorReport({
      mode: 'skill',
      skillBase: '.claude/skills/blueprint',
      findings: [createMissingStructureFinding('.claude/skills/blueprint/reference/align.md')],
      isClean: false,
      hasBlockingFindings: true,
    })

    expect(cleanReport.split('\n')[0]).toBe('Mode: skill')
    expect(findingsReport.split('\n')[0]).toBe('Mode: skill')
    expect(findingsReport).toContain('Blueprint Doctor found integrity issues:')
  })

  it('T-R11-2.C.1.2: prepends legacy migration advisory for clean and findings-present reports', () => {
    const cleanReport = renderDoctorReport({
      mode: 'legacy',
      findings: [],
      isClean: true,
      hasBlockingFindings: false,
    })
    const findingsReport = renderDoctorReport({
      mode: 'legacy',
      findings: [createMissingStructureFinding('docs/core/alignment.md')],
      isClean: false,
      hasBlockingFindings: true,
    })

    expect(cleanReport.split('\n')[0]).toBe('Mode: legacy — consider migrating to skill mode')
    expect(findingsReport.split('\n')[0]).toBe('Mode: legacy — consider migrating to skill mode')
    expect(findingsReport).toContain('Blueprint Doctor found integrity issues:')
  })
})
