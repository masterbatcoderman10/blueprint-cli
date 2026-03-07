import {
  type DoctorAuditResult,
  type DoctorFinding,
  type DriftedFileFinding,
  type ManifestValidationErrorFinding,
  type MissingManifestFinding,
  type MissingStructureFinding,
  type TemplateVersionMismatchFinding,
} from './findings'

export interface DoctorFindingGroups {
  missingStructure: MissingStructureFinding[]
  driftedFiles: DriftedFileFinding[]
  missingManifest: MissingManifestFinding[]
  versionMismatch: TemplateVersionMismatchFinding[]
  validationErrors: ManifestValidationErrorFinding[]
}

export function groupDoctorFindings(findings: DoctorFinding[]): DoctorFindingGroups {
  return {
    missingStructure: findings.filter((finding): finding is MissingStructureFinding => finding.kind === 'missing-structure'),
    driftedFiles: findings.filter((finding): finding is DriftedFileFinding => finding.kind === 'drifted-file'),
    missingManifest: findings.filter((finding): finding is MissingManifestFinding => finding.kind === 'missing-manifest'),
    versionMismatch: findings.filter(
      (finding): finding is TemplateVersionMismatchFinding => finding.kind === 'template-version-mismatch',
    ),
    validationErrors: findings.filter(
      (finding): finding is ManifestValidationErrorFinding => finding.kind === 'manifest-validation-error',
    ),
  }
}

export function renderDoctorReport(result: DoctorAuditResult): string {
  if (result.isClean) {
    return 'Blueprint Doctor: no integrity findings. Project is aligned with bundled templates.'
  }

  const groups = groupDoctorFindings(result.findings)
  const lines = ['Blueprint Doctor found integrity issues:']

  if (groups.missingStructure.length > 0) {
    lines.push('Missing structure:')
    for (const finding of groups.missingStructure) {
      lines.push(`- ${finding.targetPath}`)
    }
  }

  if (groups.driftedFiles.length > 0) {
    lines.push('Drifted canonical files:')
    for (const finding of groups.driftedFiles) {
      lines.push(`- ${finding.targetPath}`)
    }
  }

  if (groups.missingManifest.length > 0) {
    lines.push('Legacy manifest bootstrap required:')
    for (const finding of groups.missingManifest) {
      lines.push(`- ${finding.targetPath}`)
    }
  }

  if (groups.versionMismatch.length > 0) {
    lines.push('Template version recommendations:')
    for (const finding of groups.versionMismatch) {
      lines.push(`- ${finding.targetPath}: ${finding.recommendation}`)
    }
  }

  if (groups.validationErrors.length > 0) {
    lines.push('Manifest validation errors:')
    for (const finding of groups.validationErrors) {
      lines.push(`- ${finding.targetPath}: ${finding.message}`)
    }
  }

  return lines.join('\n')
}
