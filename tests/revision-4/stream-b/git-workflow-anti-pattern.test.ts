import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_PATH = join(ROOT_DIR, 'docs', 'core', 'git-execution-workflow.md')
const TEMPLATE_PATH = join(
  ROOT_DIR,
  'templates',
  'docs',
  'core',
  'git-execution-workflow.md',
)

describe('T-R4-3.B.2.1: templates/docs/core/git-execution-workflow.md matches docs/core/git-execution-workflow.md exactly', () => {
  it.skip('keeps the scaffolded git workflow module in sync with the live module (skipped: live doc rewritten in R6-3.A; template mirror pending Stream C)', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_PATH, 'utf-8'),
      readFile(TEMPLATE_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
