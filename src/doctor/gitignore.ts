import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BLUEPRINT_HEADER = '# Blueprint'
const TRACKER_DB_LINE = 'docs/.blueprint/tasks.db'

function ensureTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`
}

function splitLines(value: string): string[] {
  return value.replace(/\n$/, '').split('\n')
}

export async function ensureTrackerDbIgnored(projectRoot: string): Promise<boolean> {
  const gitignorePath = join(projectRoot, '.gitignore')

  let content = ''
  try {
    content = await readFile(gitignorePath, 'utf-8')
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code !== 'ENOENT') {
      throw error
    }
  }

  const normalized = ensureTrailingNewline(content)
  if (normalized.trim().length === 0) {
    await writeFile(gitignorePath, `${BLUEPRINT_HEADER}\n${TRACKER_DB_LINE}\n`, 'utf-8')
    return true
  }

  const lines = splitLines(normalized)
  if (lines.includes(TRACKER_DB_LINE)) {
    return false
  }

  const blueprintHeaderIndex = lines.findIndex((line) => line === BLUEPRINT_HEADER)
  if (blueprintHeaderIndex >= 0) {
    lines.splice(blueprintHeaderIndex + 1, 0, TRACKER_DB_LINE)
  } else {
    if (lines[lines.length - 1] !== '') {
      lines.push('')
    }
    lines.push(BLUEPRINT_HEADER, TRACKER_DB_LINE)
  }

  await writeFile(gitignorePath, `${lines.join('\n')}\n`, 'utf-8')
  return true
}
