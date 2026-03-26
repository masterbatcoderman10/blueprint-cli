import { access, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CANONICAL_CORE_FILES } from '../../../src/doctor/structure'
import {
  resolveAllCoreTemplatePaths,
  resolveTemplatePath,
} from '../../../src/doctor/inventory'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_SRS_PLANNING_PATH = join(ROOT_DIR, 'docs', 'core', 'srs-planning.md')

describe('T-R3-1.0.3.1: srs-planning.md is included in resolved bundled core template paths', () => {
  it('returns an entry for docs/core/srs-planning.md', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/srs-planning.md')

    const entry = resolveAllCoreTemplatePaths().find(
      (candidate) => candidate.relativePath === 'docs/core/srs-planning.md',
    )

    expect(entry).toBeDefined()
    expect(entry?.absolutePath).toContain('templates')
    expect(entry?.absolutePath).toContain('docs/core')
    expect(entry?.absolutePath).toContain('srs-planning.md')
  })
})

describe('T-R3-1.0.3.2: template file exists and is non-empty at templates/docs/core/srs-planning.md', () => {
  it('exists, begins with a Markdown heading, and matches the live module', async () => {
    const templatePath = resolveTemplatePath('docs/core/srs-planning.md')

    await expect(access(templatePath)).resolves.toBeUndefined()

    const [templateContent, liveContent] = await Promise.all([
      readFile(templatePath, 'utf-8'),
      readFile(LIVE_SRS_PLANNING_PATH, 'utf-8'),
    ])

    expect(templateContent.length).toBeGreaterThan(0)
    expect(templateContent.trimStart().startsWith('#')).toBe(true)
    expect(templateContent).toBe(liveContent)
  })
})
