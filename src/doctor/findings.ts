export interface MissingStructureFinding {
  kind: 'missing-structure'
  targetPath: string
  repairable: true
  scope: 'directory' | 'file'
  message: string
}

export interface MissingManifestFinding {
  kind: 'missing-manifest'
  targetPath: string
  repairable: true
  message: string
}

export interface DriftedFileFinding {
  kind: 'drifted-file'
  targetPath: string
  repairable: true
  message: string
}

export interface TemplateVersionMismatchFinding {
  kind: 'template-version-mismatch'
  targetPath: string
  repairable: true
  projectVersion: string
  bundledVersion: string
  recommendation: string
  message: string
}

export interface ManifestValidationErrorFinding {
  kind: 'manifest-validation-error'
  targetPath: string
  repairable: false
  message: string
}

export type DoctorFinding =
  | MissingStructureFinding
  | MissingManifestFinding
  | DriftedFileFinding
  | TemplateVersionMismatchFinding
  | ManifestValidationErrorFinding

export interface DoctorAuditResult {
  findings: DoctorFinding[]
  isClean: boolean
  hasBlockingFindings: boolean
}

export function createMissingStructureFinding(
  targetPath: string,
  scope: 'directory' | 'file' = 'file',
): MissingStructureFinding {
  return {
    kind: 'missing-structure',
    targetPath,
    repairable: true,
    scope,
    message: `${scope === 'directory' ? 'Required directory' : 'Required file'} is missing: ${targetPath}`,
  }
}

export function createMissingManifestFinding(targetPath: string): MissingManifestFinding {
  return {
    kind: 'missing-manifest',
    targetPath,
    repairable: true,
    message: `Blueprint manifest is missing at ${targetPath}; bootstrap metadata can be created for this legacy project.`,
  }
}

export function createDriftedFileFinding(targetPath: string): DriftedFileFinding {
  return {
    kind: 'drifted-file',
    targetPath,
    repairable: true,
    message: `Canonical file content differs from the bundled template: ${targetPath}`,
  }
}

export function createTemplateVersionMismatchFinding(
  targetPath: string,
  projectVersion: string,
  bundledVersion: string,
  recommendation: string,
): TemplateVersionMismatchFinding {
  return {
    kind: 'template-version-mismatch',
    targetPath,
    repairable: true,
    projectVersion,
    bundledVersion,
    recommendation,
    message: `Project template version ${projectVersion} differs from bundled template version ${bundledVersion}.`,
  }
}

export function createManifestValidationErrorFinding(
  targetPath: string,
  message: string,
): ManifestValidationErrorFinding {
  return {
    kind: 'manifest-validation-error',
    targetPath,
    repairable: false,
    message,
  }
}
