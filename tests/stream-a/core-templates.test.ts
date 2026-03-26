import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The canonical set of 18 core protocol files that must exist
 * under templates/docs/core/ for the scaffold engine.
 */
const CANONICAL_CORE_FILES = [
  'alignment.md',
  'blueprint-structure.md',
  'bug-resolution.md',
  'execution.md',
  'git-execution-workflow.md',
  'git-review-workflow.md',
  'health-check.md',
  'hierarchy.md',
  'milestone-planning.md',
  'phase-completion.md',
  'phase-planning.md',
  'planning.md',
  'prd-planning.md',
  'review.md',
  'revision-planning.md',
  'scope-change.md',
  'test-planning.md',
  'tweak-planning.md',
] as const

const TEMPLATES_CORE_DIR = resolve(__dirname, '..', '..', 'templates', 'docs', 'core')

describe('T-A.2: Core protocol template files', () => {
  it('T-A.2.1: all 18 core protocol files exist under templates/docs/core/', async () => {
    const entries = await readdir(TEMPLATES_CORE_DIR)
    const mdFiles = entries.filter((f) => f.endsWith('.md')).sort()

    expect(mdFiles).toEqual([...CANONICAL_CORE_FILES].sort())
    expect(mdFiles).toHaveLength(18)
  })

  it('T-A.2.2: core protocol template files are valid Markdown (non-empty, begin with heading)', async () => {
    for (const filename of CANONICAL_CORE_FILES) {
      const filePath = join(TEMPLATES_CORE_DIR, filename)
      const content = await readFile(filePath, 'utf8')

      // Non-empty
      expect(content.length, `${filename} should be non-empty`).toBeGreaterThan(0)

      // Starts with a Markdown heading (# at the beginning of the file, possibly after whitespace)
      const trimmed = content.trimStart()
      expect(trimmed.startsWith('#'), `${filename} should start with a Markdown heading`).toBe(true)
    }
  })
})
