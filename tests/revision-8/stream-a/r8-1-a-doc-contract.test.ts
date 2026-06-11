import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

async function readDoc(pathSegments: string[]): Promise<string> {
  return readFile(join(ROOT_DIR, ...pathSegments), 'utf-8')
}

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.1  —  Session-start tracker.md guidance                  */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.1: tracker guidance remains on the legacy entry-point surface', () => {
  it('AGENTS.md delegates setup to the blueprint skill instead of carrying SessionStart tracker guidance', async () => {
    const content = await readDoc(['AGENTS.md'])
    expect(content).toContain('Invoke the `blueprint` skill')
    expect(content).not.toContain('docs/core/tracker.md')
    expect(content).not.toContain('<SessionStart>')
  })

  it('templates/AGENTS.md mirrors tracker.md loading step', async () => {
    const content = await readDoc(['templates', 'AGENTS.md'])
    expect(content).toContain('docs/core/tracker.md')
    expect(content).toMatch(/Load docs\/core\/tracker\.md.*HTTP API recipes/i)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.2–A.5  —  API-only tracker mutation anti-patterns        */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.2: execution.md anti-pattern', () => {
  it('contains Direct Tracker Database Mutation anti-pattern', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/Direct Tracker Database Mutation/)
    expect(content).toMatch(/docs\/\.blueprint\/tasks\.db/)
    expect(content).toMatch(/tracker HTTP API/)
    expect(content).toMatch(/docs\/core\/tracker\.md/)
  })
})

describe('T-R8-1.A.3: review.md anti-pattern', () => {
  it('contains Direct Tracker Database Mutation anti-pattern', async () => {
    const content = await readDoc(['docs', 'core', 'review.md'])
    expect(content).toMatch(/Direct Tracker Database Mutation/)
    expect(content).toMatch(/docs\/\.blueprint\/tasks\.db/)
    expect(content).toMatch(/tracker HTTP API/)
  })
})

describe('T-R8-1.A.4: git-execution-workflow.md anti-pattern', () => {
  it('contains Direct Tracker Database Mutation anti-pattern', async () => {
    const content = await readDoc(['docs', 'core', 'git-execution-workflow.md'])
    expect(content).toMatch(/Direct Tracker Database Mutation/)
    expect(content).toMatch(/docs\/\.blueprint\/tasks\.db/)
    expect(content).toMatch(/tracker HTTP API/)
  })
})

describe('T-R8-1.A.5: git-review-workflow.md anti-pattern', () => {
  it('contains Direct Tracker Database Mutation anti-pattern', async () => {
    const content = await readDoc(['docs', 'core', 'git-review-workflow.md'])
    expect(content).toMatch(/Direct Tracker Database Mutation/)
    expect(content).toMatch(/docs\/\.blueprint\/tasks\.db/)
    expect(content).toMatch(/tracker HTTP API/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.6  —  Filtered lookup guidance                           */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.6: Execution filtered lookup guidance', () => {
  it('StartGateOrStream STEP 1 documents phase+stream query filter', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/GET \/tasks\?phase=.*&stream=/)
    expect(content).toMatch(/FILTERED LOOKUP GUIDANCE/)
  })

  it('ApplyReviewNotes STEP 1 documents phase+stream query filter', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/Use filtered lookup when milestone.*phase.*stream/)
    expect(content).toMatch(/GET \/tasks\?phase=<phase>&stream=<stream>/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.7  —  Task creation description guidance                 */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.7: Task creation description guidance', () => {
  it('does not scaffold Review Notes section in description template', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    // The TaskCreation description template should not contain "Review Notes:"
    const taskCreationMatch = content.match(/<TaskCreation>[\s\S]*?<\/TaskCreation>/)
    expect(taskCreationMatch).toBeTruthy()
    expect(taskCreationMatch![0]).not.toMatch(/Review Notes:/)
  })

  it('explicitly forbids stream-title duplication', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/Do not duplicate the stream title/)
  })

  it('directs review feedback to tracker comments', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/POST \/tasks\/:id\/comments/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.8  —  Review comment feedback guidance                   */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.8: Review comment feedback guidance', () => {
  it('review.md requires actionable feedback as tracker comments', async () => {
    const content = await readDoc(['docs', 'core', 'review.md'])
    expect(content).toMatch(/POST \/tasks\/:id\/comments/)
    expect(content).toMatch(/severity.*MAJOR|severity.*MINOR/)
  })

  // R9-1.C.7 forward-update: review.md now uses POST /tasks/:id/reject (gated endpoint)
  it('ReviewProcess STEP 2 uses tracker comments instead of description prose', async () => {
    const content = await readDoc(['docs', 'core', 'review.md'])
    expect(content).toMatch(/Reject the task using/)
    expect(content).toMatch(/POST \/tasks\/:id\/reject/)
    expect(content).toMatch(/severity.*MAJOR|severity.*MINOR/)
  })

  it('ReReview section references comment listing and replies', async () => {
    const content = await readDoc(['docs', 'core', 'review.md'])
    expect(content).toMatch(/GET \/tasks\/:id\/comments/)
    expect(content).toMatch(/reply comments/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.9  —  Execution addressing reply-to-comments guidance    */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.9: Execution addressing reply-to-comments guidance', () => {
  it('ApplyReviewNotes STEP 2 reads review comments from tracker', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/STEP 2 -- READ REVIEW COMMENTS/)
    expect(content).toMatch(/GET \/tasks\/:id\/comments/)
  })

  it('ApplyReviewNotes STEP 3f requires replies with parent_id', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/Reply to each reviewer comment/)
    expect(content).toMatch(/parent_id/)
    expect(content).toMatch(/POST \/tasks\/:id\/comments/)
  })

  it('includes curl example for threaded reply', async () => {
    const content = await readDoc(['docs', 'core', 'execution.md'])
    expect(content).toMatch(/curl -X POST.*\/tasks.*comments/)
    expect(content).toMatch(/"parent_id"/)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R8-1.A.10  —  Template parity for touched docs                  */
/* ------------------------------------------------------------------ */

describe('T-R8-1.A.10: Template parity for touched tracker-facing docs', () => {
  const mirrorPairs = [
    { source: 'docs/core/execution.md', template: 'templates/docs/core/execution.md' },
    { source: 'docs/core/review.md', template: 'templates/docs/core/review.md' },
    { source: 'docs/core/git-execution-workflow.md', template: 'templates/docs/core/git-execution-workflow.md' },
    { source: 'docs/core/git-review-workflow.md', template: 'templates/docs/core/git-review-workflow.md' },
  ]

  it.each(mirrorPairs)('$source ↔ $template byte-for-byte', async ({ source, template }) => {
    const sourceContent = await readDoc(source.split('/'))
    const templateContent = await readDoc(template.split('/'))
    expect(templateContent).toBe(sourceContent)
  })
})
