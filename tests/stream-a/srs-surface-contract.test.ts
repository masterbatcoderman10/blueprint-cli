import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')

const DOC_PAIRS = [
  ['docs/core/blueprint-structure.md', 'templates/docs/core/blueprint-structure.md'],
  ['docs/core/health-check.md', 'templates/docs/core/health-check.md'],
  ['docs/core/planning.md', 'templates/docs/core/planning.md'],
] as const

describe('T-A.4: SRS protocol surfaces are represented in the live and template docs', () => {
  it('blueprint-structure documents docs/srs.md and docs/core/srs-planning.md', async () => {
    for (const [livePath, templatePath] of [DOC_PAIRS[0]]) {
      const [liveContent, templateContent] = await Promise.all([
        readFile(resolve(ROOT, livePath), 'utf-8'),
        readFile(resolve(ROOT, templatePath), 'utf-8'),
      ])

      for (const content of [liveContent, templateContent]) {
        expect(content).toContain('docs/srs.md')
        expect(content).toContain('docs/core/srs-planning.md')
        expect(content).toContain('All four are REQUIRED')
      }
    }
  })

  it('health-check documents docs/srs.md and the legacy repair path', async () => {
    for (const [livePath, templatePath] of [DOC_PAIRS[1]]) {
      const [liveContent, templateContent] = await Promise.all([
        readFile(resolve(ROOT, livePath), 'utf-8'),
        readFile(resolve(ROOT, templatePath), 'utf-8'),
      ])

      for (const content of [liveContent, templateContent]) {
        expect(content).toContain('docs/srs.md')
        expect(content).toContain('legacy Blueprint projects missing `docs/srs.md`')
        expect(content).toContain('repairable compatibility path')
      }
    }
  })

  it('planning represents SRS between PRD and milestone planning', async () => {
    for (const [livePath, templatePath] of [DOC_PAIRS[2]]) {
      const [liveContent, templateContent] = await Promise.all([
        readFile(resolve(ROOT, livePath), 'utf-8'),
        readFile(resolve(ROOT, templatePath), 'utf-8'),
      ])

      for (const content of [liveContent, templateContent]) {
        expect(content).toContain('SRS between PRD and milestone planning')
        expect(content).toContain('docs/core/srs-planning.md')
      }
    }
  })
})
