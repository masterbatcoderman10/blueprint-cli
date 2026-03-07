import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { RepairAction } from './repair'
import { writeManifest } from './manifest'

export interface RepairResult {
  success: boolean
  applied: number
  failed: number
  errors: string[]
}

/**
 * Executes a list of repair actions.
 */
export async function executeRepairs(actions: RepairAction[], projectDir: string): Promise<RepairResult> {
  const errors: string[] = []
  let applied = 0
  let failed = 0

  for (const action of actions) {
    try {
      await executeRepairAction(action, projectDir)
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
  }
}

async function executeRepairAction(action: RepairAction, projectDir: string): Promise<void> {
  const targetPath = join(projectDir, action.targetPath)

  switch (action.type) {
    case 'create-from-template': {
      if (action.targetPath.includes('/') && !action.templatePath) {
        // This is a directory creation
        await mkdir(targetPath, { recursive: true })
      } else if (action.templatePath) {
        // This is a file copy from template
        const templateContent = await readFile(action.templatePath, 'utf-8')
        const targetDir = dirname(targetPath)
        await mkdir(targetDir, { recursive: true })
        await writeFile(targetPath, templateContent, 'utf-8')
      } else {
        throw new Error('create-from-template action missing templatePath for file')
      }
      break
    }

    case 'replace-in-place': {
      if (!action.templatePath) {
        throw new Error('replace-in-place action missing templatePath')
      }
      const templateContent = await readFile(action.templatePath, 'utf-8')
      await writeFile(targetPath, templateContent, 'utf-8')
      break
    }

    case 'bootstrap-manifest': {
      if (!action.manifestData) {
        throw new Error('bootstrap-manifest action missing manifestData')
      }
      await writeManifest(projectDir, action.manifestData)
      break
    }

    default: {
      const _exhaustive: never = action.type
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

  return lines.join('\n')
}
