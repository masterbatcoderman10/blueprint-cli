import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..')
const TWEAK_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'tweak-planning.md')
const SRS_PATH = resolve(REPO_ROOT, 'docs', 'srs.md')

async function readDoc(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

/**
 * Extract the contents of an XML-style block tag (e.g. <TweakMode>...</TweakMode>).
 * Returns the inner body without the surrounding tags, or null if not present.
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

// ---------------------------------------------------------------------------
// T-R8-2.A.1: Change-first loop (understand → restate → confirm → change → cycle → verify → post-hoc doc)
// ---------------------------------------------------------------------------
describe('T-R8-2.A.1: change-first loop in docs/core/tweak-planning.md', () => {
  it('describes the seven change-first loop steps in order', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // Extract the change-first loop section
    const loopBlock = extractBlock(content, 'TweakChangeFirstLoop')
    expect(loopBlock, '<TweakChangeFirstLoop> block must be present').not.toBeNull()
    const lower = (loopBlock ?? '').toLowerCase()

    // All seven step labels must be present within the loop section
    expect(lower).toMatch(/understand/)
    expect(lower).toMatch(/restate/)
    expect(lower).toMatch(/confirm/)
    expect(lower).toMatch(/change/)
    expect(lower).toMatch(/cycle/)
    expect(lower).toMatch(/verify/)
    expect(lower).toMatch(/post.hoc\s+doc|post.hoc document/)

    // The seven steps must appear in the correct sequence within the loop
    const understandPos = lower.indexOf('understand')
    const restatePos = lower.indexOf('restate')
    const confirmPos = lower.indexOf('confirm')
    // 'change' must follow confirm — use STEP 4 label
    const step4Pos = lower.indexOf('step 4')
    const cyclePos = lower.indexOf('cycle')
    const verifyPos = lower.indexOf('verify')
    const postHocIdx = lower.search(/post.hoc\s+doc|post.hoc document/)

    expect(understandPos).toBeGreaterThan(-1)
    expect(restatePos).toBeGreaterThan(-1)
    expect(confirmPos).toBeGreaterThan(-1)
    expect(step4Pos).toBeGreaterThan(-1)
    expect(cyclePos).toBeGreaterThan(-1)
    expect(verifyPos).toBeGreaterThan(-1)
    expect(postHocIdx).toBeGreaterThan(-1)

    expect(understandPos).toBeLessThan(restatePos)
    expect(restatePos).toBeLessThan(confirmPos)
    expect(confirmPos).toBeLessThan(step4Pos)
    expect(step4Pos).toBeLessThan(cyclePos)
    expect(cyclePos).toBeLessThan(verifyPos)
    expect(verifyPos).toBeLessThan(postHocIdx)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.2: Tweak Mode section (anti-ceremony)
// ---------------------------------------------------------------------------
describe('T-R8-2.A.2: Tweak Mode section in docs/core/tweak-planning.md', () => {
  it('contains a <TweakMode> block forbidding tracker tasks', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    expect((block ?? '').toLowerCase()).toMatch(/tweak mode/)
  })

  it('Tweak Mode section forbids tracker/board task creation', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not create|does not create|no tracker|no board/)
  })

  it('Tweak Mode section forbids loading planning modules', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not load|does not load|no.*planning module|no full planning/)
  })

  it('Tweak Mode section forbids gate/stream subdivision', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not subdivide|does not subdivide|no gates|no streams|gate.*stream/)
  })

  it('Tweak Mode section forbids formal test plans', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not scaffold|does not scaffold|no formal test plan/)
  })

  it('Tweak Mode section forbids pre-execution planning artifacts', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not write|does not write|no.*planning artifact|pre.execution|in advance/)
  })

  it('Tweak Mode section forbids ModuleRouting detours', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()
    expect(lower).toMatch(/not detour|does not detour|no.*modulerouting|modulerouting/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.3: Audit-only post-hoc tweak document shape
// ---------------------------------------------------------------------------
describe('T-R8-2.A.3: post-hoc tweak document shape in docs/core/tweak-planning.md', () => {
  it('lists exactly the four required post-hoc doc sections', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // All four required section names must appear in the doc shape guidance
    expect(content).toMatch(/\*\*Status\*\*|Status\s*\n|##\s+Status/)
    expect(content).toMatch(/Summary of Change/)
    expect(content).toMatch(/Files Touched/)
    expect(content).toMatch(/User Acceptance Note/)
  })

  it('post-hoc doc shape guidance does not list Goals, Dependencies, Tasks, Acceptance Criteria, Verification, or Definition of Done as required sections', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // Extract the TweakPostHocDocShape block
    const block = extractBlock(content, 'TweakPostHocDocShape')
    expect(block, '<TweakPostHocDocShape> block must be present').not.toBeNull()
    // Find the REQUIRED SECTIONS list within the block (before FORBIDDEN)
    const forbiddenIdx = (block ?? '').indexOf('FORBIDDEN')
    const requiredSection = (block ?? '').slice(0, forbiddenIdx > -1 ? forbiddenIdx : undefined).toLowerCase()

    // Forbidden section names must NOT appear as REQUIRED headings
    // (they may appear in the FORBIDDEN section, which is after the required list)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*goals\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*dependencies\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*task table\*\*|\*\*task tables\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*acceptance criteria\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*verification\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*definition of done\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*test plan\*\*/m)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.4: Code-change test gate
// ---------------------------------------------------------------------------
describe('T-R8-2.A.4: code-change test gate in docs/core/tweak-planning.md', () => {
  it('requires npm test green before doc creation', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/npm test/)
    expect(lower).toMatch(/green|pass/)
  })

  it('requires user approval before doc creation', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/user approval|user.*approv/)
  })

  it('exempts docs-only tweaks from the test gate', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/docs.only|docs only|doc.only|documentation.only/)
    // Must mention that docs-only tweaks skip the gate
    expect(lower).toMatch(/skip|exempt/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.5: Escalation block
// ---------------------------------------------------------------------------
describe('T-R8-2.A.5: escalation block in docs/core/tweak-planning.md', () => {
  it('contains hard-stop language for Tweak Mode escalation', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/hard.stop|hard stop/)
  })

  it('routes the decision to the user without automatic rerouting', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/user decides|user.*route|the user.*decide/)
    expect(lower).toMatch(/no automatic|not automatic/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.6: Anti-Patterns section
// ---------------------------------------------------------------------------
describe('T-R8-2.A.6: Anti-Patterns section in docs/core/tweak-planning.md', () => {
  it('contains an <AntiPatterns> block', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'AntiPatterns')
    expect(block, '<AntiPatterns> block must be present').not.toBeNull()
  })

  it('lists all eight forbidden ceremony anti-patterns by locked entry name', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'AntiPatterns')
    expect(block, '<AntiPatterns> block must be present').not.toBeNull()
    const blockText = block ?? ''

    const lockedNames = [
      'Creating Tracker Tasks for a Tweak',
      'Writing Tweak Doc Before Change',
      'Loading Planning Modules in Tweak Mode',
      'Carving Tweak into Gates or Streams',
      'Drafting Formal Test Plan for Tweak',
      'Skipping Change-First Confirm Step',
      'Skipping npm test Before Doc Creation',
      'Continuing in Tweak Mode After Escalation',
    ]

    for (const name of lockedNames) {
      expect(blockText, `AntiPatterns block must contain entry named "${name}"`).toContain(`name="${name}"`)
    }
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.7: No tracker-milestone language
// ---------------------------------------------------------------------------
describe('T-R8-2.A.7: no tracker-milestone language in docs/core/tweak-planning.md', () => {
  it('contains no Tweak <n> — <name> tracker-milestone pattern outside historical/example contexts', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // The tracker milestone string "Tweak <n> — <name>" should not appear as a live instruction
    // (it may appear in archive/superseded references but not as a prescribed pattern to follow)
    // We check that the doc does NOT instruct agents to use this milestone string
    const lines = content.split('\n')
    const milestoneLang = lines.filter(
      (l) =>
        /Tweak\s+<n>\s+[—–-]+\s+<name>/.test(l) &&
        !/supersede|archive|retired|removed|was|old|previous/i.test(l),
    )
    expect(milestoneLang).toHaveLength(0)
  })

  it('contains no tracker-task scaffolding instructions (milestone: Tweak pattern, TO-DO state creation)', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    // Should not instruct creating tracker tasks under a "Tweak <n>" milestone
    expect(content).not.toMatch(/milestone.*Tweak \d|milestone.*`Tweak <n>/)
    // Should not instruct the agent to create tasks in TO-DO state for a tweak
    // (i.e. no "create a tracker task ... state: TO-DO" scaffolding language)
    expect(content).not.toMatch(/state.*TO-DO.*tweak|tweak.*state.*TO-DO/)
    // Should not instruct to create tracker tasks under the Tweak <n> milestone
    expect(content).not.toMatch(/create.*tracker.*tasks.*under|under.*milestone.*Tweak/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.8: Worked example with change-first flow and audit-only post-hoc doc
// ---------------------------------------------------------------------------
describe('T-R8-2.A.8: worked example in docs/core/tweak-planning.md', () => {
  it('contains a worked example section', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    expect(content.toLowerCase()).toMatch(/worked example/)
  })

  it('worked example demonstrates the change-first flow end-to-end', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    // The worked example must show the flow
    const exampleIdx = lower.indexOf('worked example')
    expect(exampleIdx).toBeGreaterThan(-1)
    const exampleSection = lower.slice(exampleIdx, exampleIdx + 5000)
    // Should show the change-first steps
    expect(exampleSection).toMatch(/understand|restate|confirm/)
  })

  it('worked example ends with a sample post-hoc tweak doc in audit-only shape', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    const exampleIdx = lower.indexOf('worked example')
    expect(exampleIdx).toBeGreaterThan(-1)
    const exampleSection = lower.slice(exampleIdx)

    // The four required audit-only sections must appear at the end of the worked example
    expect(exampleSection).toMatch(/status/)
    expect(exampleSection).toMatch(/summary of change/)
    expect(exampleSection).toMatch(/files touched/)
    expect(exampleSection).toMatch(/user acceptance note/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.A.9: SRS MAS-207 sub-detail and change-log
// ---------------------------------------------------------------------------
describe('T-R8-2.A.9: MAS-207 in docs/srs.md carries locked sub-detail bullets', () => {
  it('MAS-207 exists in the SRS requirement index', async () => {
    const content = await readDoc(SRS_PATH)
    expect(content).toContain('MAS-207')
  })

  it('MAS-207 description carries Tweak Mode sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    // Find the description block under "#### MAS-207" heading
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart, 'MAS-207 description block (#### MAS-207) must exist').toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/tweak mode/)
  })

  it('MAS-207 description carries change-first loop sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/change.first/)
  })

  it('MAS-207 description carries audit-only doc shape sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/audit.only/)
  })

  it('MAS-207 description carries naming convention sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex)
    expect(sectionContent).toMatch(/tweak-<n>-<slug>\.md/)
  })

  it('MAS-207 description carries code-change test gate sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/code.change.*test gate|test gate/)
  })

  it('MAS-207 description carries escalation hard-stop sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/escalation|hard.stop/)
  })

  it('MAS-207 description carries anti-patterns sub-detail bullet', async () => {
    const content = await readDoc(SRS_PATH)
    const descStart = content.indexOf('#### MAS-207')
    expect(descStart).toBeGreaterThan(-1)
    const descEnd = content.indexOf('\n#### ', descStart + 1)
    const nextSectionEnd = content.indexOf('\n### ', descStart + 1)
    const stopIndex = [descEnd, nextSectionEnd].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER)
    const sectionContent = content.slice(descStart, stopIndex === Number.MAX_SAFE_INTEGER ? undefined : stopIndex).toLowerCase()
    expect(sectionContent).toMatch(/anti.pattern/)
  })

  it('MAS-207 metadata block has a Phase 2 change-log entry', async () => {
    const content = await readDoc(SRS_PATH)
    // Find MAS-207 metadata block (anchored to ### MAS-207)
    const metaStart = content.search(/^### MAS-207\s*$/m)
    expect(metaStart, 'MAS-207 metadata block must exist').toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock =
      metaEndMatch === -1
        ? content.slice(metaStart)
        : content.slice(metaStart, metaStart + 1 + metaEndMatch)

    // Must have a change-log entry referencing Phase 2 planning / R8 Phase 2
    expect(metaBlock).toMatch(/phase 2|R8.*phase 2|revision 8.*phase 2/i)
    expect(metaBlock).toMatch(/^- 2026-/m)
  })

  // NOTE: Updated at Phase 2 completion — MAS-207 transitions to active per DoD.
  it('MAS-207 status is active (Phase 2 complete)', async () => {
    const content = await readDoc(SRS_PATH)
    const metaStart = content.search(/^### MAS-207\s*$/m)
    expect(metaStart).toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock =
      metaEndMatch === -1
        ? content.slice(metaStart)
        : content.slice(metaStart, metaStart + 1 + metaEndMatch)

    expect(metaBlock).toContain('Status: active')
    expect(metaBlock).not.toContain('Status: approved-pending-implementation')
  })

  it('MAS-206 remains superseded by MAS-207', async () => {
    const content = await readDoc(SRS_PATH)
    // MAS-206 metadata block should still show superseded status
    const metaStart = content.search(/^### MAS-206\s*$/m)
    expect(metaStart).toBeGreaterThan(-1)
    const metaEndMatch = content.slice(metaStart + 1).search(/^### MAS-/m)
    const metaBlock =
      metaEndMatch === -1
        ? content.slice(metaStart)
        : content.slice(metaStart, metaStart + 1 + metaEndMatch)

    expect(metaBlock).toMatch(/superseded by.*MAS-207|superseded.*MAS-207/i)
  })
})
