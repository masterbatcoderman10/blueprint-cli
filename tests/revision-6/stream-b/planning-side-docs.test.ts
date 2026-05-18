import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const DOCS_CORE_DIR = resolve(__dirname, '..', '..', '..', 'docs', 'core')

async function loadDoc(name: string): Promise<string> {
  return readFile(resolve(DOCS_CORE_DIR, name), 'utf8')
}

function kanbanHits(content: string): string[] {
  const hits: string[] = []
  const patterns = [/vibe-kanban/gi, /kanban MCP/gi, /Kanban project/gi]
  for (const pattern of patterns) {
    const matches = content.match(pattern)
    if (matches) {
      hits.push(...matches)
    }
  }
  return hits
}

describe('T-R6-3.B.1: docs/core/health-check.md rewrite', () => {
  it('T-R6-3.B.1.1: has zero kanban hits', async () => {
    const content = await loadDoc('health-check.md')
    expect(kanbanHits(content)).toHaveLength(0)
  })

  it('T-R6-3.B.1.2: documents DB-presence check and agent-initiated background boot', async () => {
    const content = await loadDoc('health-check.md')
    expect(content).toMatch(/tasks\.db/)
    expect(content).toMatch(/blueprint board/i)
    expect(content).toMatch(/background/i)
    expect(content).toMatch(/boot/i)
  })

  it('T-R6-3.B.1.3: uses tracker project id field name', async () => {
    const content = await loadDoc('health-check.md')
    expect(content).toMatch(/tracker project id/i)
    expect(content).not.toMatch(/kanban project name/i)
  })
})

describe('T-R6-3.B.2: docs/core/alignment.md rewrite', () => {
  it('T-R6-3.B.2.1: has zero kanban hits', async () => {
    const content = await loadDoc('alignment.md')
    expect(kanbanHits(content)).toHaveLength(0)
  })

  it('T-R6-3.B.2.2: replaces KanbanSetup with TrackerSetup', async () => {
    const content = await loadDoc('alignment.md')
    expect(content).toMatch(/TrackerSetup/i)
    expect(content).not.toMatch(/KanbanSetup/i)
  })
})

describe('T-R6-3.B.3: docs/core/phase-planning.md rewrite', () => {
  it('T-R6-3.B.3: has zero kanban hits', async () => {
    const content = await loadDoc('phase-planning.md')
    expect(kanbanHits(content)).toHaveLength(0)
  })

  it('uses "tracker" wording for full ID reference', async () => {
    const content = await loadDoc('phase-planning.md')
    expect(content).toMatch(/tracker/)
  })
})

describe('T-R6-3.B.4: docs/core/tweak-planning.md rewrite', () => {
  it('T-R6-3.B.4: has zero kanban hits and uses tracker note wording', async () => {
    const content = await loadDoc('tweak-planning.md')
    expect(kanbanHits(content)).toHaveLength(0)
    expect(content).toMatch(/tracker note/i)
  })
})

describe('T-R6-3.B.5: docs/core/scope-change.md rewrite', () => {
  it('T-R6-3.B.5: has zero kanban hits and uses tracker task-creation wording', async () => {
    const content = await loadDoc('scope-change.md')
    expect(kanbanHits(content)).toHaveLength(0)
    expect(content).toMatch(/tracker task/i)
  })
})

describe('T-R6-3.B.6: docs/core/blueprint-structure.md rewrite', () => {
  it('T-R6-3.B.6: has zero kanban hits', async () => {
    const content = await loadDoc('blueprint-structure.md')
    expect(kanbanHits(content)).toHaveLength(0)
  })
})
