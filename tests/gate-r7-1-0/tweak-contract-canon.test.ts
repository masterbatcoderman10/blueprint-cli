import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..')
const TWEAK_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'tweak-planning.md')
const PHASE_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'phase-planning.md')
const TWEAKS_README_PATH = resolve(REPO_ROOT, 'docs', 'tweaks', 'README.md')
const SRS_PATH = resolve(REPO_ROOT, 'docs', 'srs.md')

async function readDoc(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

/**
 * Extract the contents of an XML-style block tag (e.g. <TweakDefinition>...</TweakDefinition>).
 * Returns the inner body without the surrounding tags, or null if the tag is not present.
 */
function extractBlock(content: string, tagName: string): string | null {
  const open = `<${tagName}>`
  const close = `</${tagName}>`
  const start = content.indexOf(open)
  if (start === -1) return null
  const end = content.indexOf(close, start + open.length)
  if (end === -1) return null
  return content.slice(start + open.length, end)
}

describe('T-R7-1.0.1: docs/core/tweak-planning.md standalone contract canon', () => {
  it('T-R7-1.0.1.1: contains a <TweakDefinition> block with positive and negative examples', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakDefinition')
    expect(block, '<TweakDefinition> block must be present').not.toBeNull()
    const body = (block ?? '').toLowerCase()
    // Positive and negative example sentinels — must appear inside the definition block.
    expect(body).toContain('positive example')
    expect(body).toContain('negative example')
  })

  it('T-R7-1.0.1.2: contains a <TweakIntentClassification> block with a proactive classification rule', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakIntentClassification')
    expect(block, '<TweakIntentClassification> block must be present').not.toBeNull()
    const body = (block ?? '').toLowerCase()
    // Must instruct proactive classification regardless of user wording.
    expect(body).toMatch(/proactive|proactively/)
    expect(body).toMatch(/classif/) // "classify", "classification"
    expect(body).toMatch(/regardless|even (if|when)/)
  })

  it('T-R7-1.0.1.3: contains a <TweakReviewGate> block with TO-DO gate phrasing', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakReviewGate')
    expect(block, '<TweakReviewGate> block must be present').not.toBeNull()
    const body = block ?? ''
    // Gate must reference TO-DO and require explicit user confirmation as mandatory.
    expect(body).toContain('TO-DO')
    expect(body.toLowerCase()).toContain('mandatory')
    expect(body.toLowerCase()).toMatch(/confirm|confirmation/)
  })

  it('T-R7-1.0.1.4: contains a complete worked example tweak document', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // Example region delimited by a worked-example heading; content must include
    // a full lightweight tweak structure end-to-end.
    expect(content.toLowerCase()).toContain('worked example')
    // Lightweight structure section headings must all appear inside the doc.
    const requiredHeadings = [
      '## Goals',
      '## Dependencies',
      '## Acceptance Criteria',
      '## Verification',
      '## Definition of Done',
      '## Status',
    ]
    for (const heading of requiredHeadings) {
      expect(content).toContain(heading)
    }
  })

  it('T-R7-1.0.1.5: locks tweak-<n>-<slug>.md naming and Tweak <n> — <name> milestone', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    expect(content).toContain('tweak-<n>-<slug>.md')
    expect(content).toContain('Tweak <n> — <name>')
  })

  it('T-R7-1.0.1.6: has no formal Test Plan heading inside the template region', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakTemplate')
    expect(block, '<TweakTemplate> block must be present so absence of Test Plan can be asserted within it').not.toBeNull()
    // The template region must not include a formal Test Plan section.
    expect(block ?? '').not.toMatch(/^\s*##\s+Test Plan\s*$/m)
  })
})

describe('T-R7-1.0.2: docs/core/phase-planning.md <PhaseTemplate> contains no ## Tweaks heading', () => {
  it('T-R7-1.0.2: PhaseTemplate has no ## Tweaks section', async () => {
    const content = await readDoc(PHASE_PLANNING_PATH)
    const block = extractBlock(content, 'PhaseTemplate')
    expect(block, '<PhaseTemplate> block must be present').not.toBeNull()
    expect(block ?? '').not.toMatch(/^\s*##\s+Tweaks\s*$/m)
  })
})

describe('T-R7-1.0.3: docs/tweaks/README.md placeholder', () => {
  it('T-R7-1.0.3: README exists, links to tweak-planning.md, documents naming convention', async () => {
    expect(existsSync(TWEAKS_README_PATH), 'docs/tweaks/README.md must exist').toBe(true)
    const content = await readDoc(TWEAKS_README_PATH)
    // Must link to the canonical contract module.
    expect(content).toMatch(/docs\/core\/tweak-planning\.md/)
    // Must document the file-naming convention.
    expect(content).toContain('tweak-<n>-<slug>.md')
  })
})

describe('T-R7-1.0.4: docs/srs.md MAS-206 deepening', () => {
  it('T-R7-1.0.4: MAS-206 carries locked sub-detail bullets + 2026-05-19 change-log entry', async () => {
    const content = await readDoc(SRS_PATH)

    // Locate MAS-206 description section (under Must Have requirements).
    const descStart = content.indexOf('#### MAS-206')
    expect(descStart, 'MAS-206 description block must exist').toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const descBlock = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex)

    // Locked sub-detail bullets — must explicitly call out the canonical sub-details.
    expect(descBlock).toContain('tweak-<n>-<slug>.md')
    expect(descBlock).toContain('Tweak <n> — <name>')
    expect(descBlock.toLowerCase()).toContain('lightweight')
    expect(descBlock.toLowerCase()).toMatch(/no formal test plan/)
    expect(descBlock.toLowerCase()).toMatch(/doctor/)

    // Locate MAS-206 metadata block (line-anchored "### MAS-206", not the "#### " description heading).
    const metaStart = content.search(/^### MAS-206\s*$/m)
    expect(metaStart, 'MAS-206 metadata block must exist').toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock = metaEndMatch === -1 ? content.slice(metaStart) : content.slice(metaStart, metaStart + 1 + metaEndMatch)

    // ID, priority, status unchanged.
    expect(metaBlock).toContain('Priority: Must')
    expect(metaBlock).toContain('Status: approved-pending-implementation')
    // 2026-05-19 change-log entry present.
    expect(metaBlock).toMatch(/^- 2026-05-19\s+-\s+.+/m)
  })
})
