import { access, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CANONICAL_CORE_FILES } from '../../../src/doctor/structure'
import {
  resolveAllCoreTemplatePaths,
  resolveTemplatePath,
} from '../../../src/doctor/inventory'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_ORCHESTRATE_PATH = join(ROOT_DIR, 'docs', 'core', 'orchestrate.md')

describe('T-R5-1.0.2.1: orchestrate.md is included in resolved bundled core template paths', () => {
  it('returns an entry for docs/core/orchestrate.md', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/orchestrate.md')

    const entry = resolveAllCoreTemplatePaths().find(
      (candidate) => candidate.relativePath === 'docs/core/orchestrate.md',
    )

    expect(entry).toBeDefined()
    expect(entry?.absolutePath).toContain('templates')
    expect(entry?.absolutePath).toContain('docs/core')
    expect(entry?.absolutePath).toContain('orchestrate.md')
  })
})

describe('T-R5-1.0.2.2: template file exists and is valid at templates/docs/core/orchestrate.md', () => {
  it('exists, begins with a Markdown heading, and matches the live module', async () => {
    const templatePath = resolveTemplatePath('docs/core/orchestrate.md')

    await expect(access(templatePath)).resolves.toBeUndefined()

    const [templateContent, liveContent] = await Promise.all([
      readFile(templatePath, 'utf-8'),
      readFile(LIVE_ORCHESTRATE_PATH, 'utf-8'),
    ])

    expect(templateContent.length).toBeGreaterThan(0)
    expect(templateContent.trimStart().startsWith('#')).toBe(true)
    expect(templateContent).toBe(liveContent)
  })
})
