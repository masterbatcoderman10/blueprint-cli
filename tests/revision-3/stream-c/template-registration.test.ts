import { access, readFile, readdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveAllCoreTemplatePaths, resolveTemplatePath } from '../../../src/doctor/inventory'
import { CANONICAL_CORE_FILES, EDITABLE_PROJECT_DOCS } from '../../../src/doctor/structure'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const TEMPLATES_CORE_DIR = join(ROOT_DIR, 'templates', 'docs', 'core')

describe('T-R3-1.C.2.1: canonical core template inventory includes srs-planning.md as the nineteenth module', () => {
  it('tracks docs/core/srs-planning.md in both structure and resolved core template inventory', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/srs-planning.md')
    expect(CANONICAL_CORE_FILES).toHaveLength(19)

    const srsPlanningEntry = resolveAllCoreTemplatePaths().find(
      (entry) => entry.relativePath === 'docs/core/srs-planning.md',
    )

    expect(srsPlanningEntry).toBeDefined()
    expect(srsPlanningEntry?.absolutePath).toContain('templates')
    expect(srsPlanningEntry?.absolutePath.endsWith('srs-planning.md')).toBe(true)
  })
})

describe('T-R3-1.C.2.2: templates/docs/core contains exactly 19 Markdown protocol files including srs-planning.md', () => {
  it('matches the canonical inventory and count', async () => {
    const mdFiles = (await readdir(TEMPLATES_CORE_DIR))
      .filter((entry) => entry.endsWith('.md'))
      .sort()

    expect(mdFiles).toEqual(CANONICAL_CORE_FILES.map((relativePath) => basename(relativePath)).sort())
    expect(mdFiles).toHaveLength(19)
    expect(mdFiles).toContain('srs-planning.md')
  })
})

describe('T-R3-1.C.2.3: editable shell inventory includes docs/srs.md', () => {
  it('treats docs/srs.md as an editable project doc with a bundled root shell', async () => {
    expect(EDITABLE_PROJECT_DOCS).toContain('docs/srs.md')

    const srsShellPath = resolveTemplatePath('docs/srs.md')
    expect(srsShellPath).toContain('templates')
    expect(srsShellPath.endsWith('srs.md')).toBe(true)

    await expect(access(srsShellPath)).resolves.toBeUndefined()
  })
})

describe('T-R3-1.C.3.1: bundled template resolution locates both docs/core/srs-planning.md and docs/srs.md', () => {
  it('resolves readable bundled templates for the new core module and editable shell', async () => {
    const resolvedPaths = [
      resolveTemplatePath('docs/core/srs-planning.md'),
      resolveTemplatePath('docs/srs.md'),
    ]

    for (const templatePath of resolvedPaths) {
      await expect(access(templatePath)).resolves.toBeUndefined()
      const content = await readFile(templatePath, 'utf-8')
      expect(content.length, `${templatePath} should be non-empty`).toBeGreaterThan(0)
    }
  })
})
