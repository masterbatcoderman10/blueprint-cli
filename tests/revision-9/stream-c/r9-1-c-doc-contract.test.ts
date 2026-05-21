import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

async function readCoreDoc(name: string): Promise<string> {
  return readFile(join(ROOT_DIR, 'docs', 'core', name), 'utf-8')
}

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.3  —  phase-planning.md anti-pattern                      */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.3: Stream-Title Duplication anti-pattern in phase-planning.md', () => {
  it('T-R9-1.C.3.1: anti-pattern exists inside <AntiPatterns> block with required children', async () => {
    const content = await readCoreDoc('phase-planning.md')

    const antiPatternsMatch = content.match(/<AntiPatterns>[\s\S]*?<\/AntiPatterns>/)
    expect(antiPatternsMatch, '<AntiPatterns> block should exist').toBeTruthy()

    const block = antiPatternsMatch![0]

    expect(block).toMatch(/<AntiPattern name="Stream-Title Duplication in Task Titles">/)
    expect(block).toMatch(/<BadExample>/)
    expect(block).toMatch(/<Why>/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.1  —  execution.md canonical endpoint references          */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.1: execution.md uses gated endpoints for canonical transitions', () => {
  it('T-R9-1.C.1.1: references POST /tasks/:id/start and POST /tasks/:id/submit with curl recipes', async () => {
    const content = await readCoreDoc('execution.md')
    expect(content).toMatch(/POST \/tasks\/[^\s\/]+\/start/)
    expect(content).toMatch(/POST \/tasks\/[^\s\/]+\/submit/)
    expect(content).toMatch(/curl -X POST.*\/start/)
    expect(content).toMatch(/curl -X POST.*\/submit/)
  })

  it('T-R9-1.C.1.2: no longer contains raw PATCH state recipes for IN-PROGRESS or IN-REVIEW transitions', async () => {
    const content = await readCoreDoc('execution.md')
    // Enumerated phrases that existed before the rewrite
    const forbiddenPatterns = [
      /PATCH \/tasks\/[^\s\/]+[\s\S]{0,200}"state"\s*:\s*"IN-PROGRESS"/,
      /PATCH \/tasks\/[^\s\/]+[\s\S]{0,200}"state"\s*:\s*"IN-REVIEW"/,
    ]

    for (const pattern of forbiddenPatterns) {
      expect(content).not.toMatch(pattern)
    }
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.2  —  review.md approve/reject references                 */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.2: review.md documents approve/reject endpoints', () => {
  it('T-R9-1.C.2.1: documents POST /tasks/:id/approve and POST /tasks/:id/reject with multi-comment examples', async () => {
    const content = await readCoreDoc('review.md')
    expect(content).toMatch(/POST \/tasks\/[^\s\/]+\/approve/)
    expect(content).toMatch(/POST \/tasks\/[^\s\/]+\/reject/)
    expect(content).toMatch(/curl -X POST.*\/approve/)
    expect(content).toMatch(/curl -X POST.*\/reject/)
    // Multi-comment examples
    expect(content).toMatch(/comments/)
    expect(content).toMatch(/MAJOR/)
    expect(content).toMatch(/MINOR/)
  })

  it('T-R9-1.C.2.2: states reject ≥1 comment requirement explicitly', async () => {
    const content = await readCoreDoc('review.md')
    expect(content).toMatch(/reject[\s\S]{0,200}at least one[\s\S]{0,200}comment/i)
  })

  it('T-R9-1.C.2.3: no longer contains raw PATCH state recipes for DONE or REWORK transitions', async () => {
    const content = await readCoreDoc('review.md')
    const forbiddenPatterns = [
      /PATCH \/tasks\/[^\s\/]+[\s\S]{0,200}"state"\s*:\s*"DONE"/,
      /PATCH \/tasks\/[^\s\/]+[\s\S]{0,200}"state"\s*:\s*"REWORK"/,
    ]

    for (const pattern of forbiddenPatterns) {
      expect(content).not.toMatch(pattern)
    }
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.4  —  orchestrate.md endpoint reference updates           */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.4: orchestrate.md references new endpoint names', () => {
  it('T-R9-1.C.4.1: references new endpoint names where previous tracker state-change references existed', async () => {
    const content = await readCoreDoc('orchestrate.md')
    // Should reference the new workflow endpoints
    expect(content).toMatch(/start|submit|approve|reject|resume/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.7  —  R6/R7/R8 doc-contract test forward updates          */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.7: R6/R7/R8 doc-contract tests forward-updated', () => {
  it('T-R9-1.C.7.1: R6 orchestrate.md test references new state-machine arrows', async () => {
    const content = await readFile(
      join(ROOT_DIR, 'tests', 'revision-6', 'stream-a', 'r6-3-a-protocol-docs.test.ts'),
      'utf-8',
    )
    expect(content).toMatch(/REWORK\s*--resume-->\s*IN-PROGRESS\s*--submit-->\s*IN-REVIEW/)
  })

  it('T-R9-1.C.7.1: R8 review.md test references reject endpoint', async () => {
    const content = await readFile(
      join(ROOT_DIR, 'tests', 'revision-8', 'stream-a', 'r8-1-a-doc-contract.test.ts'),
      'utf-8',
    )
    expect(content).toMatch(/Reject the task using/)
    expect(content).toMatch(/POST \/tasks\/:id\/reject/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-1.C.6  —  SRS MAS-204 change log                              */
/* ------------------------------------------------------------------ */

describe('T-R9-1.C.6: SRS MAS-204 change-log entry', () => {
  it('T-R9-1.C.6.1: MAS-204 contains dated R9 P1 elaboration entry', async () => {
    const content = await readFile(join(ROOT_DIR, 'docs', 'srs.md'), 'utf-8')

    const mas204Match = content.match(/\n### MAS-204[\s\S]*?(?=\n### MAS-205|$)/)
    expect(mas204Match, 'MAS-204 section should exist').toBeTruthy()

    const mas204 = mas204Match![0]
    expect(mas204).toContain('Revision 9 Phase 1')
    expect(mas204).toMatch(/gated workflow endpoint|multi-comment|idempotent/i)
  })
})
