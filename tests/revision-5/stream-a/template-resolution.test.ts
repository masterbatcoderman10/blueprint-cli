import { access, readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { resolveTemplatePath } from '../../../src/doctor/inventory'

describe('T-R5-1.A.3.3: resolveTemplatePath locates docs/core/orchestrate.md', () => {
  it('returns a readable bundled template path for the orchestration module', async () => {
    const templatePath = resolveTemplatePath('docs/core/orchestrate.md')

    await expect(access(templatePath)).resolves.toBeUndefined()

    const content = await readFile(templatePath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
    expect(content.trimStart().startsWith('#')).toBe(true)
  })
})
