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
    const alignmentFlowEndIndex = liveContent.indexOf('</AlignmentFlow>')

    expect(antiPatternsIndex).toBeGreaterThan(-1)
    expect(alignmentFlowEndIndex).toBeGreaterThan(-1)
    expect(antiPatternsIndex).toBeGreaterThan(alignmentFlowEndIndex)
    expect(liveContent).toContain('<AntiPatterns>')
    expect(liveContent).toContain(`<AntiPattern name="Don't Rush">`)
    expect(liveContent).toContain(
      'The agent writes `<ProjectConventions>` or `<AgentOrchestration>` to disk before the user explicitly approves the current setup draft.',
    )
    expect(liveContent).toContain(
      'The agent gets partial feedback on setup guidance but still pushes ahead to write files or move into Foundation Planning before the current setup stage is approved.',
    )
    expect(liveContent).toContain(
      'The agent turns setup alignment into product planning by drafting PRD, SRS, milestone, phase, test-plan, tracker-task, board, or project-progress artifacts.',
    )
    expect(liveContent).toContain(
      'Alignment exists to establish agent setup only.',
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
