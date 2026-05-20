import { describe, expect, it } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const DOCS_CORE = resolve(__dirname, '../../docs/core')

function grepFile(file: string, pattern: string): string {
  try {
    return execSync(`grep -in "${pattern}" ${resolve(DOCS_CORE, file)}`, { encoding: 'utf-8' })
  } catch (e: any) {
    if (e.status === 1) return ''
    throw e
  }
}

describe('R6-3.B.1: health-check.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('health-check.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('documents tasks.db check', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'health-check.md'), 'utf-8')
    expect(content).toContain('tasks.db exists')
  })

  it('documents background boot of blueprint board', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'health-check.md'), 'utf-8')
    expect(content).toMatch(/blueprint board/i)
    expect(content).toMatch(/background/i)
  })

  it('uses tracker project id', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'health-check.md'), 'utf-8')
    expect(content).toContain('tracker project id')
    expect(content).not.toContain('kanban project name')
  })
})

describe('R6-3.B.2: alignment.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('alignment.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('contains TrackerSetup', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'alignment.md'), 'utf-8')
    expect(content).toContain('TrackerSetup')
  })

  it('does not contain KanbanSetup', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'alignment.md'), 'utf-8')
    expect(content).not.toContain('KanbanSetup')
  })

  it('mentions init provisioning tasks.db', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'alignment.md'), 'utf-8')
    expect(content).toContain('tasks.db')
    expect(content).toContain('blueprint init')
  })
})

describe('R6-3.B.3: phase-planning.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('phase-planning.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('uses tracker terminology for full ID', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'phase-planning.md'), 'utf-8')
    expect(content).toContain('tracker')
    expect(content).toContain('full ID')
  })
})

describe('R6-3.B.4: tweak-planning.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('tweak-planning.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  // NOTE: R8 Phase 2 rewrote this module for the MAS-207 change-first workflow.
  // The original "tracker note" assertion (MAS-206) is superseded. The module
  // still references the tracker to forbid tracker/board task creation during
  // Tweak Mode (MAS-207 anti-ceremony contract).
  it('references tracker in anti-ceremony context (MAS-207 contract)', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'tweak-planning.md'), 'utf-8')
    expect(content).toContain('tracker')
  })
})

describe('R6-3.B.5: scope-change.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('scope-change.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('references tracker task per execution.md', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'scope-change.md'), 'utf-8')
    expect(content).toContain('tracker task')
    expect(content).toContain('execution.md')
  })
})

describe('R6-3.B.6: blueprint-structure.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('blueprint-structure.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('uses tracker project id in validation', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'blueprint-structure.md'), 'utf-8')
    expect(content).toContain('tracker project id')
  })
})

describe('R6-3.B.7: srs-planning.md', () => {
  it('has zero kanban hits', () => {
    const hits = grepFile('srs-planning.md', 'kanban')
    expect(hits.trim()).toBe('')
  })

  it('uses tracker terminology in SRS principles', () => {
    const content = readFileSync(resolve(DOCS_CORE, 'srs-planning.md'), 'utf-8')
    expect(content).toContain('Tracker task state')
  })
})
