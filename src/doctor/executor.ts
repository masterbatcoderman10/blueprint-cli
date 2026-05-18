import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { ensureTrackerDbIgnored } from './gitignore'
import { writeManifest } from './manifest'
import { type RepairAction, type TrackerDbMigrationStep, TRACKER_DB_MIGRATION_STEPS } from './repair'
import { isEditableProjectDoc } from './structure'
import { openDb } from '../tracker/db'
import { importSnapshot, readSnapshot } from '../tracker/export'
import { parseProjectMetaFromProgress, seedProjectMeta } from '../tracker/project-meta'

export interface RepairActionResult {
  type: RepairAction['type']
  targetPath: string
  description: string
  steps?: TrackerDbMigrationStepResult[]
}

export interface TrackerDbMigrationStepResult {
  key: TrackerDbMigrationStep['key']
  description: string
  status: 'applied' | 'skipped (no snapshot)' | 'skipped (snapshot invalid)' | 'skipped (already current)'
  outcome:
    | 'created-db'
    | 'imported-from-snapshot'
    | 'skipped-snapshot'
    | 'seeded-meta'
    | 'skipped-meta-already-present'
    | 'gitignore-modified'
    | 'gitignore-already-current'
}

export interface RepairResult {
  success: boolean
  applied: number
  failed: number
  errors: string[]
  actionResults?: RepairActionResult[]
}

/**
 * Executes a list of repair actions.
 */
export async function executeRepairs(actions: RepairAction[], projectDir: string): Promise<RepairResult> {
  const errors: string[] = []
  const actionResults: RepairActionResult[] = []
  let applied = 0
  let failed = 0

  for (const action of actions) {
    try {
      actionResults.push(await executeRepairAction(action, projectDir))
      applied++
    } catch (error) {
      failed++
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to ${action.description}: ${message}`)
    }
  }

  return {
    success: failed === 0,
    applied,
    failed,
    errors,
    actionResults,
  }
}

function renderTemplateForRepair(templateContent: string, targetPath: string, projectDir: string): string {
  if (!isEditableProjectDoc(targetPath)) {
    return templateContent
  }

  return templateContent.replace(/\{\{project-name\}\}/g, basename(projectDir))
}

async function snapshotExists(projectDir: string): Promise<boolean> {
  try {
    await access(join(projectDir, 'docs', '.blueprint', 'tasks.export.json'))
    return true
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function hasProjectMetaRow(db: import('../tracker/schema').TrackerDatabase): boolean {
  const row = db.prepare('SELECT 1 AS present FROM project_meta WHERE id = 1').get() as { present: number } | undefined
  return row?.present === 1
}

async function executeTrackerDbMigration(
  action: Extract<RepairAction, { type: 'migrate-tracker-db' }>,
  projectDir: string,
): Promise<RepairActionResult> {
  const steps: TrackerDbMigrationStepResult[] = []
  const handle = openDb(projectDir)

  try {
    steps.push({
      key: 'create-db',
      description: TRACKER_DB_MIGRATION_STEPS[0].description,
      status: 'applied',
      outcome: 'created-db',
    })

    if (await snapshotExists(projectDir)) {
      try {
        importSnapshot(handle.db, await readSnapshot(projectDir))
        steps.push({
          key: 'import-snapshot',
          description: TRACKER_DB_MIGRATION_STEPS[1].description,
          status: 'applied',
          outcome: 'imported-from-snapshot',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown snapshot import error'
        console.warn(`[doctor] tracker snapshot import skipped: ${message}`)
        steps.push({
          key: 'import-snapshot',
          description: TRACKER_DB_MIGRATION_STEPS[1].description,
          status: 'skipped (snapshot invalid)',
          outcome: 'skipped-snapshot',
        })
      }
    } else {
      steps.push({
        key: 'import-snapshot',
        description: TRACKER_DB_MIGRATION_STEPS[1].description,
        status: 'skipped (no snapshot)',
        outcome: 'skipped-snapshot',
      })
    }

    if (hasProjectMetaRow(handle.db)) {
      steps.push({
        key: 'seed-meta',
        description: TRACKER_DB_MIGRATION_STEPS[2].description,
        status: 'skipped (already current)',
        outcome: 'skipped-meta-already-present',
      })
    } else {
      seedProjectMeta(handle.db, await parseProjectMetaFromProgress(projectDir))
      steps.push({
        key: 'seed-meta',
        description: TRACKER_DB_MIGRATION_STEPS[2].description,
        status: 'applied',
        outcome: 'seeded-meta',
      })
    }

    const gitignoreModified = await ensureTrackerDbIgnored(projectDir)
    steps.push({
      key: 'ensure-gitignore',
      description: TRACKER_DB_MIGRATION_STEPS[3].description,
      status: gitignoreModified ? 'applied' : 'skipped (already current)',
      outcome: gitignoreModified ? 'gitignore-modified' : 'gitignore-already-current',
    })
  } finally {
    handle.close()
  }

  return {
    type: action.type,
    targetPath: action.targetPath,
    description: action.description,
    steps,
  }
}

async function executeRepairAction(action: RepairAction, projectDir: string): Promise<RepairActionResult> {
  const targetPath = join(projectDir, action.targetPath)

  switch (action.type) {
    case 'create-from-template': {
      if (action.targetPath.includes('/') && !action.templatePath) {
        await mkdir(targetPath, { recursive: true })
      } else if (action.templatePath) {
        const templateContent = await readFile(action.templatePath, 'utf-8')
        const renderedContent = renderTemplateForRepair(templateContent, action.targetPath, projectDir)
        await mkdir(dirname(targetPath), { recursive: true })
        await writeFile(targetPath, renderedContent, 'utf-8')
      } else {
        throw new Error('create-from-template action missing templatePath for file')
      }

      return {
        type: action.type,
        targetPath: action.targetPath,
        description: action.description,
      }
    }

    case 'replace-in-place': {
      if (!action.templatePath) {
        throw new Error('replace-in-place action missing templatePath')
      }
      const templateContent = await readFile(action.templatePath, 'utf-8')
      const renderedContent = renderTemplateForRepair(templateContent, action.targetPath, projectDir)
      await writeFile(targetPath, renderedContent, 'utf-8')
      return {
        type: action.type,
        targetPath: action.targetPath,
        description: action.description,
      }
    }

    case 'bootstrap-manifest': {
      if (!action.manifestData) {
        throw new Error('bootstrap-manifest action missing manifestData')
      }
      await writeManifest(projectDir, action.manifestData)
      return {
        type: action.type,
        targetPath: action.targetPath,
        description: action.description,
      }
    }

    case 'migrate-tracker-db':
      return executeTrackerDbMigration(action, projectDir)

    default: {
      const _exhaustive: never = action
      throw new Error(`Unknown repair action type: ${_exhaustive}`)
    }
  }
}

/**
 * Renders a summary of repair results for the user.
 */
export function renderRepairResult(result: RepairResult): string {
  const lines: string[] = []

  if (result.success) {
    lines.push(`Successfully applied ${result.applied} repair(s).`)
  } else {
    lines.push(`Applied ${result.applied} repair(s), ${result.failed} failed.`)
    lines.push('')
    lines.push('Errors:')
    for (const error of result.errors) {
      lines.push(`- ${error}`)
    }
  }

  for (const actionResult of result.actionResults ?? []) {
    if (!actionResult.steps || actionResult.steps.length === 0) {
      continue
    }

    lines.push('')
    lines.push(`[${actionResult.type}] ${actionResult.description}`)
    for (let i = 0; i < actionResult.steps.length; i++) {
      const step = actionResult.steps[i]
      lines.push(`  ${i + 1}. [${step.status}] ${step.description}`)
    }
  }

  return lines.join('\n')
}
