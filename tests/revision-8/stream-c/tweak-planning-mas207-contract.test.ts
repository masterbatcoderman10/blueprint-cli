/**
 * R8-2.C.2 — Forward-only doc-contract test for docs/core/tweak-planning.md
 *
 * Asserts that the rewritten tweak-planning module (MAS-207 contract) contains:
 *   - The change-first loop language
 *   - The Tweak Mode anti-ceremony section
 *   - The audit-only post-hoc doc shape
 *   - The code-change test gate
 *   - The escalation hard-stop block
 *   - The Anti-Patterns block
 *
 * This file is a forward-only guard. It must never be softened to accommodate
 * a rollback to the retired tracker-backed MAS-206 workflow.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..')
const TWEAK_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'tweak-planning.md')
const TWEAK_5_PATH = resolve(REPO_ROOT, 'docs', 'tweaks', 'tweak-5-pre-task-tweak-confirmation-gate.md')

async function readDoc(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

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
// T-R8-2.C.1: tweak-5 carries Superseded-by-R8-Phase-2 marker
// ---------------------------------------------------------------------------
describe('T-R8-2.C.1: tweak-5 carries Superseded marker referencing R8 Phase 2', () => {
  it('tweak-5 document contains a "Superseded by Revision 8 Phase 2" marker', async () => {
    const content = await readDoc(TWEAK_5_PATH)
    expect(content.toLowerCase()).toMatch(/superseded by revision 8 phase 2/)
  })

  it('tweak-5 Superseded marker references the phase-2 doc path', async () => {
    const content = await readDoc(TWEAK_5_PATH)
    expect(content).toMatch(/phase-2-tweak-planning-flow-rewrite\.md/)
  })
})

// ---------------------------------------------------------------------------
// T-R8-2.C.2: forward-only MAS-207 contract guard for docs/core/tweak-planning.md
// ---------------------------------------------------------------------------
describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (change-first loop)', () => {
  it('contains a <TweakChangeFirstLoop> block with all seven step labels in order', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakChangeFirstLoop')
    expect(block, '<TweakChangeFirstLoop> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()

    expect(lower).toMatch(/understand/)
    expect(lower).toMatch(/restate/)
    expect(lower).toMatch(/confirm/)
    expect(lower).toMatch(/change/)
    expect(lower).toMatch(/cycle/)
    expect(lower).toMatch(/verify/)
    expect(lower).toMatch(/post.hoc/)

    const steps = ['understand', 'restate', 'confirm', 'step 4', 'cycle', 'verify']
    const positions = steps.map((s) => lower.indexOf(s))
    for (let i = 0; i < positions.length - 1; i++) {
      expect(positions[i], `${steps[i]} must precede ${steps[i + 1]}`).toBeLessThan(positions[i + 1])
    }
  })
})

describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (Tweak Mode)', () => {
  it('contains a <TweakMode> block with Tweak Mode anti-ceremony prohibitions', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakMode')
    expect(block, '<TweakMode> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()

    // All six anti-ceremony clauses
    expect(lower).toMatch(/not create|does not create|no tracker|no board/)
    expect(lower).toMatch(/not load|does not load|no.*planning module|no full planning/)
    expect(lower).toMatch(/not subdivide|does not subdivide|no gates|no streams|gate.*stream/)
    expect(lower).toMatch(/not scaffold|does not scaffold|no formal test plan/)
    expect(lower).toMatch(/not write|does not write|no.*planning artifact|pre.execution|in advance/)
    expect(lower).toMatch(/not detour|does not detour|no.*modulerouting|modulerouting/)
  })
})

describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (audit-only doc shape)', () => {
  it('contains a <TweakPostHocDocShape> block with the four required sections', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakPostHocDocShape')
    expect(block, '<TweakPostHocDocShape> block must be present').not.toBeNull()

    expect(content).toMatch(/\*\*Status\*\*|## Status/)
    expect(content).toMatch(/Summary of Change/)
    expect(content).toMatch(/Files Touched/)
    expect(content).toMatch(/User Acceptance Note/)
  })

  it('post-hoc doc shape forbids Goals, Dependencies, Tasks, Acceptance Criteria, Verification, Definition of Done, Test Plan', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakPostHocDocShape')
    expect(block, '<TweakPostHocDocShape> block must be present').not.toBeNull()
    const forbiddenIdx = (block ?? '').indexOf('FORBIDDEN')
    const requiredSection = (block ?? '').slice(0, forbiddenIdx > -1 ? forbiddenIdx : undefined).toLowerCase()

    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*goals\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*dependencies\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*acceptance criteria\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*verification\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*definition of done\*\*/m)
    expect(requiredSection).not.toMatch(/^\s+\d+\.\s+\*\*test plan\*\*/m)
  })
})

describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (code-change test gate)', () => {
  it('code-change test gate requires npm test green AND user approval, exempts docs-only tweaks', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/npm test/)
    expect(lower).toMatch(/green|pass/)
    expect(lower).toMatch(/user approval|user.*approv/)
    expect(lower).toMatch(/docs.only|docs only|doc.only|documentation.only/)
    expect(lower).toMatch(/skip|exempt/)
  })
})

describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (escalation hard-stop)', () => {
  it('escalation block performs a hard-stop and routes decision to the user without auto-rerouting', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lower = content.toLowerCase()
    expect(lower).toMatch(/hard.stop|hard stop/)
    expect(lower).toMatch(/user decides|user.*route|the user.*decide/)
    expect(lower).toMatch(/no automatic|not automatic/)
  })
})

describe('T-R8-2.C.2: docs/core/tweak-planning.md contains MAS-207 contract (Anti-Patterns block)', () => {
  it('contains a <TweakAntiPatterns> block listing all eight forbidden ceremony behaviors', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakAntiPatterns')
    expect(block, '<TweakAntiPatterns> block must be present').not.toBeNull()
    const lower = (block ?? '').toLowerCase()

    expect(lower).toMatch(/tracker.*task|board.*task|creat.*tracker|creat.*board/)
    expect(lower).toMatch(/before the change|pre.change doc|writing.*before/)
    expect(lower).toMatch(/loading.*module|load.*planning.*module/)
    expect(lower).toMatch(/gates.*streams|streams.*gates|gate.*stream|carving/)
    expect(lower).toMatch(/formal test plan/)
    expect(lower).toMatch(/skip.*confirm|skipping.*confirm/)
    expect(lower).toMatch(/skip.*npm test|skipping.*npm test|skipped.*test gate/)
    expect(lower).toMatch(/escalation.*met|after escalation|continu.*tweak mode.*escalation/)
  })
})

// ---------------------------------------------------------------------------
// Forward-only guard: the retired MAS-206 tracker-backed workflow must not
// re-appear in docs/core/tweak-planning.md
// ---------------------------------------------------------------------------
describe('T-R8-2.C.2: forward-only guard — retired tracker-backed workflow must not reappear', () => {
  it('docs/core/tweak-planning.md contains no Tweak <n> — <name> tracker-milestone pattern as a live instruction', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const lines = content.split('\n')
    const milestoneLang = lines.filter(
      (l) =>
        /Tweak\s+<n>\s+[—–-]+\s+<name>/.test(l) &&
        !/supersede|archive|retired|removed|was|old|previous/i.test(l),
    )
    expect(milestoneLang, 'Tracker-milestone language must not appear as a live instruction').toHaveLength(0)
  })

  it('docs/core/tweak-planning.md contains no tracker-task creation instructions', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    expect(content).not.toMatch(/milestone.*Tweak \d|milestone.*`Tweak <n>/)
    expect(content).not.toMatch(/state.*TO-DO.*tweak|tweak.*state.*TO-DO/)
    expect(content).not.toMatch(/create.*tracker.*tasks.*under|under.*milestone.*Tweak/)
  })
})
