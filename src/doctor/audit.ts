import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { compareFileContent, compareTemplateVersion } from './comparator'
import {
  type DoctorFinding,
  type DoctorAuditResult,
  createDriftedFileFinding,
  createManifestValidationErrorFinding,
  createMissingManifestFinding,
  createMissingStructureFinding,
  createMissingTrackerDbFinding,
  createTemplateVersionMismatchFinding,
  createTrackerDbDriftFinding,
} from './findings'
import { getUserVersion, openDbReadOnly, runIntegrityCheck } from '../tracker/db'
import { TRACKER_SCHEMA_VERSION } from '../tracker/schema'
import { loadManifestState, ManifestParseError, resolveAllCoreTemplatePaths, resolveTemplatePath } from './inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from './manifest'
import {
  REQUIRED_BLUEPRINT_DIRECTORIES,
  REQUIRED_CANONICAL_FILES,
  getManagedAgentPaths,
} from './structure'

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

export async function auditTrackerDb(projectDir: string): Promise<DoctorFinding[]> {
  const trackerDbRelativePath = 'docs/.blueprint/tasks.db'
  if (await pathExists(join(projectDir, trackerDbRelativePath))) {
    return []
  }

  return [createMissingTrackerDbFinding(trackerDbRelativePath)]
}

export async function auditTrackerSchema(projectDir: string): Promise<DoctorFinding[]> {
  const trackerDbRelativePath = 'docs/.blueprint/tasks.db'
  const dbPath = join(projectDir, trackerDbRelativePath)

  // Stream B handles the missing-DB case; skip when tasks.db is absent
  if (!(await pathExists(dbPath))) {
    return []
  }

  const findings: DoctorFinding[] = []
  let handle: ReturnType<typeof openDbReadOnly> | null = null

  try {
    handle = openDbReadOnly(projectDir)
  } catch {
    // File exists but cannot be opened as a database — treat as integrity failure
    findings.push(
      createTrackerDbDriftFinding({
        targetPath: trackerDbRelativePath,
        cause: 'integrity-fail',
        issues: ['file is not a database'],
      }),
    )
    return findings
  }

  try {
    const observedVersion = getUserVersion(handle.db)
    if (observedVersion !== TRACKER_SCHEMA_VERSION) {
      findings.push(
        createTrackerDbDriftFinding({
          targetPath: trackerDbRelativePath,
          cause: 'schema-stale',
          observedVersion,
          expectedVersion: TRACKER_SCHEMA_VERSION,
        }),
      )
    }

    const integrityResult = runIntegrityCheck(handle.db)
    if (integrityResult !== 'ok') {
      findings.push(
        createTrackerDbDriftFinding({
          targetPath: trackerDbRelativePath,
          cause: 'integrity-fail',
          issues: integrityResult,
        }),
      )
    }
  } catch (error) {
    // A query-time failure (e.g., corrupted DB where PRAGMAs fail) also means integrity failure
    const message = error instanceof Error ? error.message : 'unknown database error'
    findings.push(
      createTrackerDbDriftFinding({
        targetPath: trackerDbRelativePath,
        cause: 'integrity-fail',
        issues: [message],
      }),
    )
  } finally {
    handle.close()
  }

  return findings
}

export async function runDoctorAudit(projectDir: string): Promise<DoctorAuditResult> {
  const findings: DoctorFinding[] = []
  const repairableEditableSrsPath = 'docs/srs.md'

  for (const relativePath of REQUIRED_BLUEPRINT_DIRECTORIES) {
    if (!(await pathExists(join(projectDir, relativePath)))) {
      findings.push(createMissingStructureFinding(relativePath, 'directory'))
    }
  }

  // Legacy Blueprint projects may predate SRS integration. Missing docs/srs.md
  // is repairable, but once it exists its content remains user-owned.
  if (!(await pathExists(join(projectDir, repairableEditableSrsPath)))) {
    findings.push(createMissingStructureFinding(repairableEditableSrsPath, 'file'))
  }

  findings.push(...(await auditTrackerDb(projectDir)))
  findings.push(...(await auditTrackerSchema(projectDir)))

  for (const relativePath of REQUIRED_CANONICAL_FILES) {
    const templatePath = resolveTemplatePath(relativePath)
    const templateContent = await readFile(templatePath, 'utf-8')
    const comparison = await compareFileContent(join(projectDir, relativePath), templateContent)

    if (comparison.state === 'missing') {
      findings.push(createMissingStructureFinding(relativePath, 'file'))
      continue
    }

    if (comparison.state === 'drifted') {
      findings.push(createDriftedFileFinding(relativePath))
    }
  }

  for (const { relativePath, absolutePath } of resolveAllCoreTemplatePaths()) {
    const templateContent = await readFile(absolutePath, 'utf-8')
    const comparison = await compareFileContent(join(projectDir, relativePath), templateContent)

    if (comparison.state === 'missing') {
      findings.push(createMissingStructureFinding(relativePath, 'file'))
      continue
    }

    if (comparison.state === 'drifted') {
      findings.push(createDriftedFileFinding(relativePath))
    }
  }

  let manifestState
  try {
    manifestState = await loadManifestState(projectDir)
  } catch (error) {
    if (error instanceof ManifestParseError) {
      findings.push(createManifestValidationErrorFinding(MANIFEST_RELATIVE_PATH, error.message))
      return {
        mode: 'legacy',
        findings,
        isClean: false,
        hasBlockingFindings: true,
      }
    }

    throw error
  }

  if (!manifestState.present) {
    findings.push(createMissingManifestFinding(MANIFEST_RELATIVE_PATH))
  } else {
    const versionCheck = compareTemplateVersion(manifestState.data.templateVersion, TEMPLATE_VERSION)
    if (!versionCheck.matches) {
      findings.push(
        createTemplateVersionMismatchFinding(
          MANIFEST_RELATIVE_PATH,
          versionCheck.projectVersion,
          versionCheck.bundledVersion,
          versionCheck.recommendation,
        ),
      )
    }

    for (const managedFile of getManagedAgentPaths(manifestState.data.managedFiles)) {
      const templateContent = await readFile(resolveTemplatePath(managedFile), 'utf-8')
      const comparison = await compareFileContent(join(projectDir, managedFile), templateContent)

      if (comparison.state === 'missing') {
        findings.push(createMissingStructureFinding(managedFile, 'file'))
        continue
      }

      if (comparison.state === 'drifted') {
        findings.push(createDriftedFileFinding(managedFile))
      }
    }
  }

  return {
    mode: 'legacy',
    findings,
    isClean: findings.length === 0,
    hasBlockingFindings: findings.some(
      (finding) =>
        finding.kind === 'manifest-validation-error' ||
        (finding.kind === 'tracker-db-drift' && finding.cause === 'integrity-fail'),
    ),
  }
}
