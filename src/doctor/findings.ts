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

export interface MissingTrackerDbFinding {
  kind: 'missing-tracker-db'
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

export interface TrackerDbDriftFinding {
  kind: 'tracker-db-drift'
  targetPath: string
  cause: 'schema-stale' | 'integrity-fail'
  repairable: boolean
  observedVersion?: number
  expectedVersion?: number
  issues?: string[]
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
  | MissingTrackerDbFinding
  | DriftedFileFinding
  | TrackerDbDriftFinding
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

export function createMissingTrackerDbFinding(targetPath: string): MissingTrackerDbFinding {
  return {
    kind: 'missing-tracker-db',
    targetPath,
    repairable: true,
    message: `Tracker database is missing: ${targetPath}`,
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

export function createTrackerDbDriftFinding(
  input:
    | {
        targetPath: string
        cause: 'schema-stale'
        observedVersion: number
        expectedVersion: number
      }
    | {
        targetPath: string
        cause: 'integrity-fail'
        issues: string[]
      },
): TrackerDbDriftFinding {
  if (input.cause === 'schema-stale') {
    return {
      kind: 'tracker-db-drift',
      targetPath: input.targetPath,
      cause: 'schema-stale',
      repairable: true,
      observedVersion: input.observedVersion,
      expectedVersion: input.expectedVersion,
      message: `Tracker database schema is stale at ${input.targetPath}: found user_version ${input.observedVersion}, expected ${input.expectedVersion}.`,
    }
  }

  return {
    kind: 'tracker-db-drift',
    targetPath: input.targetPath,
    cause: 'integrity-fail',
    repairable: false,
    issues: input.issues,
    message: `Tracker database integrity check failed at ${input.targetPath}: ${input.issues.join('; ')}`,
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
