import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

async function readCoreDoc(name: string): Promise<string> {
  const path = join(ROOT_DIR, 'docs', 'core', name)
  return readFile(path, 'utf-8')
}

function hasNoKanbanHits(content: string): boolean {
  const forbidden = /vibe-kanban|kanban MCP|Kanban project/gi
  return !forbidden.test(content)
}

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.1  —  execution.md                                        */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.1: execution.md tracker rewrite', () => {
  it('T-R6-3.A.1.1: zero kanban hits', async () => {
    const content = await readCoreDoc('execution.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  it('T-R6-3.A.1.2: ApplyReviewNotes section documents REWORK pickup with canonical transition', async () => {
    const content = await readCoreDoc('execution.md')
    expect(content).toMatch(/ApplyReviewNotes/i)
    expect(content).toMatch(/REWORK\s*→\s*IN-PROGRESS\s*→\s*IN-REVIEW/)
  })

  it('T-R6-3.A.1.3: state machine names all 5 states', async () => {
    const content = await readCoreDoc('execution.md')
    for (const state of ['TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE']) {
      expect(content).toContain(state)
    }
  })

  it('T-R6-3.A.1.4: task ops reference tracker.md curl snippets', async () => {
    const content = await readCoreDoc('execution.md')
    expect(content).toMatch(/tracker\.md/)
    expect(content).toMatch(/PATCH \/tasks/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.2  —  review.md                                          */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.2: review.md tracker rewrite', () => {
  it('T-R6-3.A.2.1: zero kanban hits', async () => {
    const content = await readCoreDoc('review.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  it('T-R6-3.A.2.2: rejection path explicitly moves task to REWORK', async () => {
    const content = await readCoreDoc('review.md')
    expect(content).toMatch(/REWORK/)
    // The rejection path should mention moving to REWORK
    expect(content).toMatch(/move.*REWORK|REWORK.*transition|to\s+REWORK/i)
  })

  it('T-R6-3.A.2.3: preconditions reference tracker.md', async () => {
    const content = await readCoreDoc('review.md')
    expect(content).toMatch(/tracker\.md/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.3  —  git-execution-workflow.md                          */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.3: git-execution-workflow.md tracker rewrite', () => {
  it('T-R6-3.A.3.1: zero kanban hits', async () => {
    const content = await readCoreDoc('git-execution-workflow.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  it('T-R6-3.A.3.2: uses tracker wording for state transitions and documents REWORK', async () => {
    const content = await readCoreDoc('git-execution-workflow.md')
    expect(content).toMatch(/tracker/i)
    expect(content).toMatch(/REWORK/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.4  —  phase-completion.md                                */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.4: phase-completion.md tracker rewrite', () => {
  it('T-R6-3.A.4.1: zero kanban hits', async () => {
    const content = await readCoreDoc('phase-completion.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  it('T-R6-3.A.4.2: references tracker.md curl recipes for task retrieval / bug-task creation', async () => {
    const content = await readCoreDoc('phase-completion.md')
    expect(content).toMatch(/tracker\.md/)
    expect(content).toMatch(/curl.*tasks/)
    expect(content).toMatch(/POST \/tasks/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.5  —  bug-resolution.md                                  */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.5: bug-resolution.md tracker rewrite', () => {
  it('T-R6-3.A.5.1: zero kanban hits', async () => {
    const content = await readCoreDoc('bug-resolution.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  it('T-R6-3.A.5.2: PATH A and PATH B both use tracker recipes', async () => {
    const content = await readCoreDoc('bug-resolution.md')
    expect(content).toMatch(/tracker\.md/)
    expect(content).toMatch(/PATH A/)
    expect(content).toMatch(/PATH B/)
    expect(content).toMatch(/PATCH \/tasks/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R6-3.A.6  —  orchestrate.md                                     */
/* ------------------------------------------------------------------ */

describe('T-R6-3.A.6: orchestrate.md tracker rewrite', () => {
  it('T-R6-3.A.6.1: zero kanban hits', async () => {
    const content = await readCoreDoc('orchestrate.md')
    expect(hasNoKanbanHits(content)).toBe(true)
  })

  // R9-1.C.7 forward-update: REWORK --resume--> IN-PROGRESS --submit--> IN-REVIEW
  it('T-R6-3.A.6.2: per-stream loop documents 5-state machine + REWORK loop', async () => {
    const content = await readCoreDoc('orchestrate.md')
    for (const state of ['TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE']) {
      expect(content).toContain(state)
    }
    expect(content).toMatch(/REWORK\s*--resume-->\s*IN-PROGRESS\s*--submit-->\s*IN-REVIEW/)
  })
})
