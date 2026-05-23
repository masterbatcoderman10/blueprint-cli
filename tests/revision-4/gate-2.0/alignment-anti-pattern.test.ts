import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const TEMPLATE_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md')

describe(`T-R4-2.0.1.1: docs/core/alignment.md contains the "Don't Rush" anti-pattern`, () => {
  it('places the new guidance in a standalone Anti-Patterns section as an XML code block', async () => {
    const liveContent = await readFile(LIVE_ALIGNMENT_PATH, 'utf-8')
    const antiPatternsIndex = liveContent.lastIndexOf('## Anti-Patterns')
    const documentProductionEndIndex = liveContent.indexOf('</DocumentProduction>')

    expect(antiPatternsIndex).toBeGreaterThan(-1)
    expect(documentProductionEndIndex).toBeGreaterThan(-1)
    expect(antiPatternsIndex).toBeGreaterThan(documentProductionEndIndex)
    expect(liveContent).toContain('<AntiPatterns>')
    expect(liveContent).toContain(`<AntiPattern name="Don't Rush">`)
    expect(liveContent).toContain(
      'The agent finishes analysis, writes the actual conventions or PRD document to disk, and only afterward asks whether the user approves the current stage.',
    )
    expect(liveContent).toContain(
      'The agent shows a current-stage draft, gets partial feedback, but still proceeds to write the next document in the flow before the user explicitly approves the current one.',
    )
    expect(liveContent).toContain(
      'The agent keeps pressing with questions like "Can I move to the next step now?" while the current-stage draft is still unapproved or open questions remain unresolved.',
    )
    expect(liveContent).toContain(
      'The confirmation loop exists to keep each stage trustworthy: show the current-stage draft, ask for approval, close open questions, then continue.',
    )
  })
})

describe('T-R4-2.0.2.1: templates/docs/core/alignment.md matches docs/core/alignment.md exactly', () => {
  it('keeps the scaffolded Alignment module in sync with the live module', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_ALIGNMENT_PATH, 'utf-8'),
      readFile(TEMPLATE_ALIGNMENT_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
