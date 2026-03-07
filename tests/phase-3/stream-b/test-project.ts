import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { resolveAllCoreTemplatePaths, resolveTemplatePath } from '../../../src/doctor/inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'

export interface CanonicalProjectOptions {
  includeManifest?: boolean
  managedFiles?: string[]
  editableDocs?: Partial<Record<'docs/prd.md' | 'docs/project-progress.md' | 'docs/conventions.md', string>>
}

export async function writeCanonicalProject(
  dir: string,
  options: CanonicalProjectOptions = {},
): Promise<void> {
  const {
    includeManifest = true,
    managedFiles = ['CLAUDE.md'],
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
