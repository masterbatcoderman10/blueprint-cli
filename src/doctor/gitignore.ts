import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BLUEPRINT_HEADER = '# Blueprint'
const TRACKER_DB_LINE = 'docs/.blueprint/tasks.db'

function ensureTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`
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

  if (content.includes(TRACKER_DB_LINE)) {
    return false
  }

  const normalized = ensureTrailingNewline(content)
  let nextContent: string
  if (normalized.trim().length === 0) {
    nextContent = `${BLUEPRINT_HEADER}\n${TRACKER_DB_LINE}\n`
  } else if (normalized.includes(BLUEPRINT_HEADER)) {
    nextContent = `${normalized}${TRACKER_DB_LINE}\n`
  } else {
    nextContent = `${normalized}\n${BLUEPRINT_HEADER}\n${TRACKER_DB_LINE}\n`
  }

  await writeFile(gitignorePath, nextContent, 'utf-8')
  return true
}
