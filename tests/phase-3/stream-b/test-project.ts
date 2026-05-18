import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { resolveAllCoreTemplatePaths, resolveTemplatePath } from '../../../src/doctor/inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'
import { openDb } from '../../../src/tracker/db'

export interface CanonicalProjectOptions {
  includeManifest?: boolean
  managedFiles?: string[]
  includeSrsDoc?: boolean
  /** Write a minimal tracker DB with seeded project metadata so Doctor audit returns clean. */
  includeTracker?: boolean
  editableDocs?: Partial<
    Record<'docs/prd.md' | 'docs/project-progress.md' | 'docs/conventions.md' | 'docs/srs.md', string>
  >
}

export async function writeCanonicalProject(
  dir: string,
  options: CanonicalProjectOptions = {},
): Promise<void> {
  const {
    includeManifest = true,
    managedFiles = ['CLAUDE.md'],
    includeSrsDoc = true,
    editableDocs = {},
  } = options

  for (const { relativePath, absolutePath } of resolveAllCoreTemplatePaths()) {
    const destination = join(dir, relativePath)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, await readFile(absolutePath, 'utf-8'), 'utf-8')
  }

  for (const managedFile of managedFiles) {
    const destination = join(dir, managedFile)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, await readFile(resolveTemplatePath(managedFile), 'utf-8'), 'utf-8')
  }

  const editableDocPaths = {
    'docs/prd.md': '# Custom PRD\n',
    'docs/project-progress.md': '# Custom Progress\n',
    'docs/conventions.md': '# Custom Conventions\n',
    ...(includeSrsDoc ? { 'docs/srs.md': '# Custom SRS\n' } : {}),
    ...editableDocs,
  }

  for (const [relativePath, content] of Object.entries(editableDocPaths)) {
    const destination = join(dir, relativePath)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, content, 'utf-8')
  }

  if (!includeManifest) {
    return
  }

  if (options.includeTracker) {
    const handle = openDb(dir)
    const now = Date.now()
    handle.db.prepare('INSERT OR REPLACE INTO project_meta (id, name, tagline, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('test-project', 'Test project', now, now)
    handle.db.close()
  }

  const manifestPath = join(dir, MANIFEST_RELATIVE_PATH)
  await mkdir(dirname(manifestPath), { recursive: true })
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        templateVersion: TEMPLATE_VERSION,
        cliVersion: '0.1.0',
        managedFiles,
      },
      null,
      2,
    ),
    'utf-8',
  )
}
