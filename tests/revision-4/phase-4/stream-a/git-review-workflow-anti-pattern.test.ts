import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..', '..')
const LIVE_FILE = join(ROOT_DIR, 'docs', 'core', 'git-review-workflow.md')
const TEMPLATE_FILE = join(ROOT_DIR, 'templates', 'docs', 'core', 'git-review-workflow.md')

describe('T-R4-4.A: Git Review Workflow Anti-Pattern Sync', () => {
  it('T-R4-4.A.1: live file contains the anti-pattern section', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPatterns>')
    expect(content).toContain('Not Cleaning Up Worktrees After Review')
  })

  it('T-R4-4.A.2.1: template file matches live file exactly', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_FILE, 'utf-8'),
      readFile(TEMPLATE_FILE, 'utf-8'),
    ])
    expect(templateContent).toBe(liveContent)
  })
})
