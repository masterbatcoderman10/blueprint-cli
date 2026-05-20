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

  it('T-R7-1.0.1.3 (updated for MAS-207): contains a <TweakChangeFirstLoop> block implementing the change-first flow', async () => {
    // MAS-206 had a <TweakReviewGate> block; MAS-207 replaces it with the change-first loop.
    // Assert the MAS-207 contract: the <TweakChangeFirstLoop> block must be present and
    // include a CONFIRM step that is mandatory before any change.
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakChangeFirstLoop')
    expect(block, '<TweakChangeFirstLoop> block must be present (MAS-207 contract)').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    // CONFIRM step is mandatory — the user must approve before the change is made.
    expect(lower).toMatch(/confirm/)
    expect(lower).toMatch(/mandatory/)
    // All seven steps of the change-first loop must be present.
    expect(lower).toMatch(/understand/)
    expect(lower).toMatch(/restate/)
    expect(lower).toMatch(/cycle/)
    expect(lower).toMatch(/verify/)
    expect(lower).toMatch(/post.hoc/)
  })

  it('T-R7-1.0.1.4 (updated for MAS-207): contains a worked example ending with audit-only post-hoc tweak doc', async () => {
    // MAS-206 worked examples showed Goals/Dependencies/Tasks/etc. headings.
    // MAS-207 worked examples end with an audit-only post-hoc doc:
    // Status, Summary of Change, Files Touched, User Acceptance Note.
    const content = await readDoc(TWEAK_PLANNING_PATH)
    expect(content.toLowerCase()).toContain('worked example')
    // Post-hoc audit-only shape section names must appear in the worked example.
    const lower = content.toLowerCase()
    const exampleIdx = lower.indexOf('worked example')
    const exampleSection = lower.slice(exampleIdx)
    expect(exampleSection).toMatch(/status/)
    expect(exampleSection).toMatch(/summary of change/)
    expect(exampleSection).toMatch(/files touched/)
    expect(exampleSection).toMatch(/user acceptance note/)
  })

  it('T-R7-1.0.1.5 (updated for MAS-207): locks tweak-<n>-<slug>.md naming; Tweak <n> — <name> tracker-milestone string must NOT appear as a live instruction', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // Naming convention must still be present.
    expect(content).toContain('tweak-<n>-<slug>.md')
    // The retired tracker-milestone string "Tweak <n> — <name>" must not appear
    // as a live agent instruction. MAS-207 superseded this pattern.
    const lines = content.split('\n')
    const milestoneLang = lines.filter(
      (l) =>
        /Tweak\s+<n>\s+[—–-]+\s+<name>/.test(l) &&
        !/supersede|archive|retired|removed|was|old|previous/i.test(l),
    )
    expect(milestoneLang, '"Tweak <n> — <name>" must not appear as a live instruction (superseded by MAS-207)').toHaveLength(0)
  })

  it('T-R7-1.0.1.6 (updated for MAS-207): <TweakPostHocDocShape> block has no formal Test Plan heading', async () => {
    // MAS-206 had a <TweakTemplate> block; MAS-207 replaces it with <TweakPostHocDocShape>.
    // The post-hoc doc shape must not include a Test Plan section.
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakPostHocDocShape')
    expect(block, '<TweakPostHocDocShape> block must be present (MAS-207 audit-only doc shape)').not.toBeNull()
    // The post-hoc doc shape must not require a formal Test Plan.
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

    // ID, priority unchanged; status superseded by MAS-207.
    expect(metaBlock).toContain('Priority: Must')
    expect(metaBlock).toContain('Status: superseded')
    expect(metaBlock).toContain('Superseded by: MAS-207')
    // 2026-05-19 change-log entry present.
    expect(metaBlock).toMatch(/^- 2026-05-19\s+-\s+.+/m)
  })
})

describe('T-R7-1.0.5 (MAS-207 contract): docs/srs.md MAS-207 exists and supersedes MAS-206', () => {
  it('MAS-207 exists in the SRS requirement index', async () => {
    const content = await readDoc(SRS_PATH)
    expect(content).toContain('MAS-207')
  })

  it('MAS-206 metadata block carries Status: superseded and Superseded by: MAS-207', async () => {
    const content = await readDoc(SRS_PATH)
    const metaStart = content.search(/^### MAS-206\s*$/m)
    expect(metaStart, 'MAS-206 metadata block must exist').toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock = metaEndMatch === -1 ? content.slice(metaStart) : content.slice(metaStart, metaStart + 1 + metaEndMatch)
    expect(metaBlock).toContain('Status: superseded')
    expect(metaBlock).toMatch(/Superseded by:.*MAS-207/)
  })

  it('MAS-207 metadata block exists with a change-log entry and approved-pending-implementation or active status', async () => {
    const content = await readDoc(SRS_PATH)
    const metaStart = content.search(/^### MAS-207\s*$/m)
    expect(metaStart, 'MAS-207 metadata block must exist').toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock =
      metaEndMatch === -1
        ? content.slice(metaStart)
        : content.slice(metaStart, metaStart + 1 + metaEndMatch)
    // Status must be approved-pending-implementation (or active after phase completion)
    expect(metaBlock).toMatch(/Status: (approved-pending-implementation|active)/)
    // Must have at least one change-log entry
    expect(metaBlock).toMatch(/^- 2026-/m)
  })
})
