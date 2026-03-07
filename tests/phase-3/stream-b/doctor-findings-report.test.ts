import { describe, expect, it } from 'vitest'

import { compareTemplateVersion } from '../../../src/doctor/comparator'
import {
  createDriftedFileFinding,
  createMissingManifestFinding,
  createMissingStructureFinding,
  createTemplateVersionMismatchFinding,
} from '../../../src/doctor/findings'
import { TEMPLATE_VERSION } from '../../../src/doctor/manifest'
import { groupDoctorFindings, renderDoctorReport } from '../../../src/doctor/report'

describe('T-B.4.1: Findings model groups Doctor issues distinctly', () => {
  it('separates missing structure, drifted files, missing manifest bootstrap, and version mismatch recommendations', () => {
    const versionCheck = compareTemplateVersion('0.9.0', TEMPLATE_VERSION)
    expect(versionCheck.matches).toBe(false)

    const findings = [
      createMissingStructureFinding('docs/core/execution.md'),
      createDriftedFileFinding('CLAUDE.md'),
      createMissingManifestFinding('docs/.blueprint/manifest.json'),
      createTemplateVersionMismatchFinding(
        'docs/.blueprint/manifest.json',
        versionCheck.matches ? TEMPLATE_VERSION : versionCheck.projectVersion,
        versionCheck.matches ? TEMPLATE_VERSION : versionCheck.bundledVersion,
        versionCheck.matches ? '' : versionCheck.recommendation,
      ),
    ]

    const groups = groupDoctorFindings(findings)

    expect(groups.missingStructure).toHaveLength(1)
    expect(groups.missingStructure[0]).toEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: 'docs/core/execution.md',
        repairable: true,
      }),
    )

    expect(groups.driftedFiles).toHaveLength(1)
    expect(groups.driftedFiles[0]).toEqual(
      expect.objectContaining({
        kind: 'drifted-file',
        targetPath: 'CLAUDE.md',
        repairable: true,
      }),
    )

    expect(groups.missingManifest).toHaveLength(1)
    expect(groups.missingManifest[0]).toEqual(
      expect.objectContaining({
        kind: 'missing-manifest',
        targetPath: 'docs/.blueprint/manifest.json',
        repairable: true,
      }),
    )

    expect(groups.versionMismatch).toHaveLength(1)
    expect(groups.versionMismatch[0]).toEqual(
      expect.objectContaining({
        kind: 'template-version-mismatch',
        targetPath: 'docs/.blueprint/manifest.json',
        repairable: true,
      }),
    )
  })
})

describe('T-B.4.2: Version mismatch reporting stays local-only', () => {
  it('renders recommendation text without implying remote template fetch or update behavior', () => {
    const versionCheck = compareTemplateVersion('0.9.0', TEMPLATE_VERSION)
    expect(versionCheck.matches).toBe(false)

    const report = renderDoctorReport({
      isClean: false,
      findings: [
        createTemplateVersionMismatchFinding(
          'docs/.blueprint/manifest.json',
          versionCheck.matches ? TEMPLATE_VERSION : versionCheck.projectVersion,
          versionCheck.matches ? TEMPLATE_VERSION : versionCheck.bundledVersion,
          versionCheck.matches ? '' : versionCheck.recommendation,
        ),
      ],
    })

    const normalized = report.toLowerCase()
    expect(report).toContain('docs/.blueprint/manifest.json')
    expect(report).toContain('blueprint doctor --repair')
    expect(normalized).not.toContain('download')
    expect(normalized).not.toContain('fetch')
    expect(normalized).not.toContain('update')
  })
})
