import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { DoctorFinding } from './findings'
import { resolveAllCoreTemplatePaths, resolveTemplatePath } from './inventory'
import { MANIFEST_RELATIVE_PATH, type ManifestData, TEMPLATE_VERSION, getCliVersion } from './manifest'
import { SUPPORTED_AGENT_FILES } from './structure'

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

/**
 * A repair action represents a concrete operation to fix an integrity issue.
 */
export interface RepairAction {
  /** The type of repair to perform */
  type: 'create-from-template' | 'replace-in-place' | 'bootstrap-manifest'
  /** The target path for the repair (relative to project root) */
  targetPath: string
  /** For template-based repairs, the source template path */
  templatePath?: string
  /** For manifest bootstrap, the managed files to record */
  manifestData?: ManifestData
  /** Human-readable description of what will be done */
  description: string
}

export interface RepairPlan {
  actions: RepairAction[]
  hasBlockingFindings: boolean
  blockingReason?: string
}

/**
 * Creates a repair plan from Doctor findings.
 * Maps each finding to one or more repair actions.
 */
export async function createRepairPlan(findings: DoctorFinding[], projectDir: string): Promise<RepairPlan> {
  const actions: RepairAction[] = []
  let hasBlockingFindings = false
  let blockingReason: string | undefined

  for (const finding of findings) {
    // Blocking findings cannot be repaired automatically
    if (finding.kind === 'manifest-validation-error') {
      hasBlockingFindings = true
      blockingReason = finding.message
      continue
    }

    // Missing structure findings → create-from-template actions
    if (finding.kind === 'missing-structure') {
      if (finding.scope === 'directory') {
        // Directories are created directly, not from templates
        actions.push({
          type: 'create-from-template',
          targetPath: finding.targetPath,
          description: `Create missing directory: ${finding.targetPath}`,
        })
      } else {
        // Files are copied from bundled templates
        const templatePath = resolveTemplatePath(finding.targetPath)
        actions.push({
          type: 'create-from-template',
          targetPath: finding.targetPath,
          templatePath,
          description: `Create missing file from template: ${finding.targetPath}`,
        })
      }
    }

    // Drifted file findings → replace-in-place actions
    if (finding.kind === 'drifted-file') {
      // Determine if this is a core file or a managed agent file
      const coreTemplates = resolveAllCoreTemplatePaths()
      const coreTemplate = coreTemplates.find((t) => t.relativePath === finding.targetPath)

      if (coreTemplate) {
        actions.push({
          type: 'replace-in-place',
          targetPath: finding.targetPath,
          templatePath: coreTemplate.absolutePath,
          description: `Replace drifted canonical file with bundled template: ${finding.targetPath}`,
        })
      } else {
        // Must be a managed agent file
        const templatePath = resolveTemplatePath(finding.targetPath)
        actions.push({
          type: 'replace-in-place',
          targetPath: finding.targetPath,
          templatePath,
          description: `Replace drifted managed agent file with bundled template: ${finding.targetPath}`,
        })
      }
    }

    // Missing manifest → bootstrap-manifest action
    if (finding.kind === 'missing-manifest') {
      // For legacy projects, we need to detect which agent files exist
      // and record them as managed files
      const existingManagedFiles: string[] = []
      for (const agentFile of SUPPORTED_AGENT_FILES) {
        const agentPath = join(projectDir, agentFile)
        if (await pathExists(agentPath)) {
          existingManagedFiles.push(agentFile)
        }
      }

      const manifestData: ManifestData = {
        templateVersion: TEMPLATE_VERSION,
        cliVersion: await getCliVersion(),
        managedFiles: existingManagedFiles,
      }

      actions.push({
        type: 'bootstrap-manifest',
        targetPath: MANIFEST_RELATIVE_PATH,
        manifestData,
        description: `Bootstrap manifest metadata for legacy Blueprint project: ${MANIFEST_RELATIVE_PATH}`,
      })
    }

    // Template version mismatch → we don't auto-repair in this phase
    // The finding is informational only; user decides whether to update
    if (finding.kind === 'template-version-mismatch') {
      // In Phase 3, version mismatch is reported but not auto-repaired
      // This is a recommendation-only finding
    }
  }

  return {
    actions,
    hasBlockingFindings,
    blockingReason,
  }
}

/**
 * Renders a summary of the repair plan for user confirmation.
 */
export function renderRepairPlan(plan: RepairPlan): string {
  if (plan.hasBlockingFindings) {
    return `Cannot proceed with repairs. Blocking issue: ${plan.blockingReason || 'Unknown error'}`
  }

  if (plan.actions.length === 0) {
    return 'No repairs needed. Project integrity is clean.'
  }

  const lines: string[] = []
  lines.push('Proposed repairs:')
  lines.push('')

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    lines.push(`  ${i + 1}. [${action.type}] ${action.description}`)
  }

  lines.push('')
  lines.push(`Total: ${plan.actions.length} repair(s) to apply.`)

  return lines.join('\n')
}
