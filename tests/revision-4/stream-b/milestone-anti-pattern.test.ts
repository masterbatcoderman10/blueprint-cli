import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_MILESTONE_PLANNING_PATH = join(ROOT_DIR, 'docs', 'core', 'milestone-planning.md')
const TEMPLATE_MILESTONE_PLANNING_PATH = join(
  ROOT_DIR,
  'templates',
  'docs',
  'core',
  'milestone-planning.md',
)

describe('T-R4-2.B.1.1: docs/core/milestone-planning.md contains the phase-assignment anti-pattern', () => {
  it('adds requirement-division guidance in a standalone Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_MILESTONE_PLANNING_PATH, 'utf-8')
    const antiPatternsIndex = liveContent.lastIndexOf('## Anti-Patterns')
    const milestoneProcessEndIndex = liveContent.indexOf('</MilestoneProcess>')

    expect(antiPatternsIndex).toBeGreaterThan(-1)
    expect(milestoneProcessEndIndex).toBeGreaterThan(-1)
    expect(antiPatternsIndex).toBeGreaterThan(milestoneProcessEndIndex)
    expect(liveContent).toContain('```xml')
    expect(liveContent).toContain('<AntiPatterns>')
    expect(liveContent).toContain('<AntiPattern name="Undivided Requirement Assignment">')
    expect(liveContent).toContain(
      'During milestone planning, the draft names multiple phases but does not associate any of them with specific SRS requirement IDs or sub-requirement IDs.',
    )
    expect(liveContent).toContain(
      'As milestone planning unfolds, assigned requirements and split sub-requirements stay pooled at milestone level instead of being assorted into phase-owned slices while the plan is being written.',
    )
    expect(liveContent).toContain(
      'If milestone planning does not assign SRS requirement IDs to phases during planning, phase planning loses its boundary, downstream ownership gets blurry, and requirement traceability breaks.',
    )
  })
})

describe('T-R4-2.B.1.2: docs/core/milestone-planning.md contains the requirement-expansion anti-pattern', () => {
  it('adds existing-requirement expansion guidance in the same Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_MILESTONE_PLANNING_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPattern name="Unexpanded Existing Requirements">')
    expect(liveContent).toContain(
      'A requirement is concise but not dense, and milestone planning leaves the original thin wording untouched even after the user has clarified what it should mean.',
    )
    expect(liveContent).toContain(
      'The milestone builds phase structure around an existing requirement without broadening that requirement text in docs/srs.md to reflect the clarified milestone-level understanding.',
    )
    expect(liveContent).toContain(
      'When an existing requirement is not dense but still under-specified, milestone planning should expand the same requirement instead of leaving it thin or forcing an unnecessary replacement.',
    )
  })
})

describe('T-R4-2.B.2.1: templates/docs/core/milestone-planning.md matches docs/core/milestone-planning.md exactly', () => {
  it('keeps the scaffolded milestone planning module in sync with the live module', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_MILESTONE_PLANNING_PATH, 'utf-8'),
      readFile(TEMPLATE_MILESTONE_PLANNING_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
