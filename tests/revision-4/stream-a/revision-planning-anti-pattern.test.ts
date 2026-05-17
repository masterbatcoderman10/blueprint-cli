import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_PATH = join(ROOT_DIR, 'docs', 'core', 'revision-planning.md')
const TEMPLATE_PATH = join(
  ROOT_DIR,
  'templates',
  'docs',
  'core',
  'revision-planning.md',
)

describe('T-R4-3.A.2.1: templates/docs/core/revision-planning.md matches docs/core/revision-planning.md exactly', () => {
  it('keeps the scaffolded revision planning module in sync with the live module', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_PATH, 'utf-8'),
      readFile(TEMPLATE_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
