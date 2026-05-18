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

export interface TrackerDbMigrationStep {
  key: 'create-db' | 'import-snapshot' | 'seed-meta' | 'ensure-gitignore'
  description: string
}

export interface TemplateRepairAction {
  type: 'create-from-template' | 'replace-in-place'
  targetPath: string
  templatePath?: string
  description: string
}

export interface BootstrapManifestRepairAction {
  type: 'bootstrap-manifest'
  targetPath: string
  manifestData?: ManifestData
  description: string
}

export interface TrackerDbMigrationRepairAction {
  type: 'migrate-tracker-db'
  targetPath: string
  description: string
  steps: TrackerDbMigrationStep[]
}

/**
 * A repair action represents a concrete operation to fix an integrity issue.
 */
export type RepairAction = TemplateRepairAction | BootstrapManifestRepairAction | TrackerDbMigrationRepairAction

export interface RepairPlan {
  actions: RepairAction[]
  hasBlockingFindings: boolean
  blockingReason?: string
}

export const TRACKER_DB_MIGRATION_STEPS: TrackerDbMigrationStep[] = [
  {
    key: 'create-db',
    description: 'Create tracker database and apply schema',
  },
  {
    key: 'import-snapshot',
    description: 'Import tasks.export.json snapshot if present',
  },
  {
    key: 'seed-meta',
    description: 'Seed project_meta from docs/project-progress.md if still empty',
  },
  {
    key: 'ensure-gitignore',
    description: 'Ensure .gitignore contains docs/.blueprint/tasks.db',
  },
]

/**
 * Creates a repair plan from Doctor findings.
 * Maps each finding to one or more repair actions.
 */
export async function createRepairPlan(findings: DoctorFinding[], projectDir: string): Promise<RepairPlan> {
  const actions: RepairAction[] = []
  let hasBlockingFindings = false
  let blockingReason: string | undefined

  for (const finding of findings) {
    if (finding.kind === 'manifest-validation-error') {
      hasBlockingFindings = true
      blockingReason = finding.message
      continue
    }

    if (finding.kind === 'missing-structure') {
      if (finding.scope === 'directory') {
        actions.push({
          type: 'create-from-template',
          targetPath: finding.targetPath,
          description: `Create missing directory: ${finding.targetPath}`,
        })
      } else {
        actions.push({
          type: 'create-from-template',
          targetPath: finding.targetPath,
          templatePath: resolveTemplatePath(finding.targetPath),
          description: `Create missing file from template: ${finding.targetPath}`,
        })
      }

      continue
    }

    if (finding.kind === 'drifted-file') {
      const coreTemplate = resolveAllCoreTemplatePaths().find((template) => template.relativePath === finding.targetPath)
      actions.push({
        type: 'replace-in-place',
        targetPath: finding.targetPath,
        templatePath: coreTemplate?.absolutePath ?? resolveTemplatePath(finding.targetPath),
        description: coreTemplate
          ? `Replace drifted canonical file with bundled template: ${finding.targetPath}`
          : `Replace drifted managed agent file with bundled template: ${finding.targetPath}`,
      })
      continue
    }

    if (finding.kind === 'missing-manifest') {
      const existingManagedFiles: string[] = []
      for (const agentFile of SUPPORTED_AGENT_FILES) {
        if (await pathExists(join(projectDir, agentFile))) {
          existingManagedFiles.push(agentFile)
        }
      }

      actions.push({
        type: 'bootstrap-manifest',
        targetPath: MANIFEST_RELATIVE_PATH,
        manifestData: {
          templateVersion: TEMPLATE_VERSION,
          cliVersion: await getCliVersion(),
          managedFiles: existingManagedFiles,
        },
        description: `Bootstrap manifest metadata for legacy Blueprint project: ${MANIFEST_RELATIVE_PATH}`,
      })
      continue
    }

    if (finding.kind === 'missing-tracker-db') {
      actions.push({
        type: 'migrate-tracker-db',
        targetPath: finding.targetPath,
        description:
          'Create the tracker database, import tasks.export.json if available, seed project metadata, and update .gitignore.',
        steps: TRACKER_DB_MIGRATION_STEPS,
      })
      continue
    }

    if (finding.kind === 'template-version-mismatch' || finding.kind === 'tracker-db-drift') {
      continue
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

  const lines: string[] = ['Proposed repairs:', '']

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    lines.push(`  ${i + 1}. [${action.type}] ${action.description}`)

    if (action.type === 'migrate-tracker-db') {
      for (let j = 0; j < action.steps.length; j++) {
        lines.push(`     ${j + 1}. [will-run] ${action.steps[j].description}`)
      }
    }
  }

  lines.push('')
  lines.push(`Total: ${plan.actions.length} repair(s) to apply.`)
  return lines.join('\n')
}
