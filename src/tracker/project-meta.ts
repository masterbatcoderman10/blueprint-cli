import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { TrackerDatabase } from './schema'

export interface ProjectMetaSeedInput {
  name: string
  tagline: string
}

function extractField(content: string, fieldName: string): string | undefined {
  const match = content.match(new RegExp(`^\\*\\*${fieldName}\\*\\*:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim()
}

export function seedProjectMeta(db: TrackerDatabase, input: ProjectMetaSeedInput): void {
  const now = Date.now()
  db.prepare(
    `INSERT OR REPLACE INTO project_meta
      (id, name, tagline, phase_count, stream_count, created_at, updated_at)
      VALUES (1, ?, ?, NULL, NULL, COALESCE((SELECT created_at FROM project_meta WHERE id = 1), ?), ?)`,
  ).run(input.name, input.tagline, now, now)
}

export async function parseProjectMetaFromProgress(projectRoot: string): Promise<ProjectMetaSeedInput> {
  const content = await readFile(join(projectRoot, 'docs', 'project-progress.md'), 'utf-8')
  const name = extractField(content, 'Project')
  if (!name) {
    throw new Error('Could not parse **Project** from docs/project-progress.md')
  }

  return {
    name,
    tagline: extractField(content, 'Tagline') ?? '',
  }
}
