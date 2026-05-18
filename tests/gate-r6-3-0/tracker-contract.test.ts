import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const TRACKER_DOC_PATH = resolve(__dirname, '..', '..', 'docs', 'core', 'tracker.md')

async function loadTrackerDoc(): Promise<string> {
  return readFile(TRACKER_DOC_PATH, 'utf8')
}

function sectionAfter(content: string, headingKeyword: string): string {
  const lines = content.split('\n')
  let inside = false
  const buffer: string[] = []

  for (const line of lines) {
    if (/^#{2,3}\s/.test(line) && line.toLowerCase().includes(headingKeyword.toLowerCase())) {
      inside = true
      continue
    }
    if (inside && /^#{2}\s/.test(line)) {
      break
    }
    if (inside) {
      buffer.push(line)
    }
  }

  return buffer.join('\n')
}

describe('T-R6-3.0.1: docs/core/tracker.md contract canon', () => {
  it('T-R6-3.0.1.1: contains all 6 required section headers', async () => {
    const content = await loadTrackerDoc()
    const requiredHeaders = [
      'Storage location',
      'Schema reference',
      '5-state machine',
      'CRUD endpoints',
      'Lock-file semantics',
      'blueprint board lifecycle',
    ]

    for (const header of requiredHeaders) {
      expect(content).toContain(header)
    }
  })

  it('T-R6-3.0.1.2: state-machine section names all 5 states + canonical REWORK→IN-PROGRESS→IN-REVIEW phrase', async () => {
    const content = await loadTrackerDoc()
    const stateSection = sectionAfter(content, 'state machine')
    expect(stateSection.length, 'state-machine section should exist and be non-empty').toBeGreaterThan(0)

    for (const state of ['TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE']) {
      expect(stateSection).toContain(state)
    }

    expect(stateSection).toMatch(/REWORK\s*→\s*IN-PROGRESS\s*→\s*IN-REVIEW/)
  })

  it('T-R6-3.0.1.3: contains curl recipes for required endpoints', async () => {
    const content = await loadTrackerDoc()
    const crudSection = sectionAfter(content, 'CRUD endpoints')
    expect(crudSection.length, 'CRUD endpoints section should exist and be non-empty').toBeGreaterThan(0)

    expect(crudSection).toContain('POST /tasks')
    expect(crudSection).toContain('PATCH /tasks/:id')
    expect(crudSection).toContain('GET /tasks?phase=')
    expect(crudSection).toContain('stream=')
    expect(crudSection).toContain('POST /tasks/:id/comments')
    expect(crudSection).toContain('GET /project')
  })

  it('T-R6-3.0.1.4: lifecycle section documents agent-initiated background boot', async () => {
    const content = await loadTrackerDoc()
    const lifecycleSection = sectionAfter(content, 'board lifecycle')
    expect(lifecycleSection.length, 'lifecycle section should exist and be non-empty').toBeGreaterThan(0)

    expect(lifecycleSection).toMatch(/agent.{0,40}background boot|background.{0,40}boot/i)
  })
})

describe('T-R6-3.0.2: Terminology + snippet canon table', () => {
  it('terminology + curl-snippet canon table present in tracker.md', async () => {
    const content = await loadTrackerDoc()

    expect(content).toMatch(/terminology|snippet table|canon table/i)
    expect(content).toContain('/tasks')
    expect(content).toContain('/tasks/:id')
    expect(content).toContain('/tasks/:id/comments')
    expect(content).toContain('/project')
  })
})
