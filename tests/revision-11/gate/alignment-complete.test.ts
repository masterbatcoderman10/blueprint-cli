import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = join(__dirname, '../../../')
const SOURCE_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const TEMPLATE_PATH = join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md')

describe('T-R11-1.0.4 — alignment.md alignment-complete step', () => {
  it('T-R11-1.0.4.1: docs/core/alignment.md has final step for alignment-complete command', () => {
    const content = readFileSync(SOURCE_PATH, 'utf-8')

    // Must reference the alignment-complete command
    expect(content).toContain('alignment-complete')

    // Must indicate it is deferred to Revision 11 Phase 6
    expect(content).toMatch(/Revision 11 Phase 6|deferred/)

    // Must indicate it runs after alignment artifacts are confirmed and committed
    expect(content.toLowerCase()).toMatch(/confirmed.*committed|committed.*confirmed/)
  })

  it('T-R11-1.0.4.2: both marker strings appear verbatim', () => {
    const content = readFileSync(SOURCE_PATH, 'utf-8')

    expect(content).toContain('<!-- blueprint-status: alignment-required -->')
    expect(content).toContain('<!-- blueprint-status: alignment-complete -->')
  })

  it('T-R11-1.0.4.3: templates/docs/core/alignment.md is byte-identical to source', () => {
    const sourceContent = readFileSync(SOURCE_PATH, 'utf-8')
    const templateContent = readFileSync(TEMPLATE_PATH, 'utf-8')

    expect(templateContent).toBe(sourceContent)
  })
})
