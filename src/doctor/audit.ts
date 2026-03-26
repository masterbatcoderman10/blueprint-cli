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
  createTemplateVersionMismatchFinding,
} from './findings'
import { loadManifestState, ManifestParseError, resolveAllCoreTemplatePaths, resolveTemplatePath } from './inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from './manifest'
import {
  REQUIRED_BLUEPRINT_DIRECTORIES,
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
    findings,
    isClean: findings.length === 0,
    hasBlockingFindings: findings.some((finding) => finding.kind === 'manifest-validation-error'),
  }
}
