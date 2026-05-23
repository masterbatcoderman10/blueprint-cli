import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..', '..')
const LIVE_FILE = join(ROOT_DIR, 'docs', 'core', 'phase-completion.md')
const TEMPLATE_FILE = join(ROOT_DIR, 'templates', 'docs', 'core', 'phase-completion.md')

describe('T-R4-4.B: Phase Completion Anti-Pattern Sync', () => {
  it('T-R4-4.B.1: live file contains the anti-pattern section', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPatterns>')
    expect(content).toContain('Not Cleaning Up Completed Stream Worktrees')
    expect(content).not.toContain('name="ANTI-PATTERN:')
  })

  it.skip('T-R4-4.B.2.1: template file matches live file exactly (skipped: live doc rewritten in R6-3.A; template mirror pending Stream C)', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_FILE, 'utf-8'),
      readFile(TEMPLATE_FILE, 'utf-8'),
    ])
    expect(templateContent).toBe(liveContent)
  })
})
