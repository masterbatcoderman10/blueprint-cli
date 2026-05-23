import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_PATH = join(ROOT_DIR, 'docs', 'core', 'phase-planning.md')
const TEMPLATE_PATH = join(
  ROOT_DIR,
  'templates',
  'docs',
  'core',
  'phase-planning.md',
)

describe('T-R4-3.0.1.1: docs/core/phase-planning.md contains the Skipping Schema Ideation anti-pattern', () => {
  it('adds Skipping Schema Ideation guidance in a standalone Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPatterns>')
    expect(liveContent).toContain('<AntiPattern name="Skipping Schema Ideation">')
    expect(liveContent).toContain(
      'A phase introduces new data concepts but moves straight to API or UI tasks without defining the underlying schema or data model.',
    )
    expect(liveContent).toContain(
      'Explicitly ideate and document the required schema changes before breaking work down into tasks.',
    )
  })
})

describe('T-R4-3.0.1.2: docs/core/phase-planning.md contains the Unconfirmed Schema Relationships anti-pattern', () => {
  it('adds Unconfirmed Schema Relationships guidance in the same Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPattern name="Unconfirmed Schema Relationships">')
    expect(liveContent).toContain(
      'New or changed schema is planned without confirming how it relates to existing tables, entities, or data models.',
    )
    expect(liveContent).toContain(
      'Identify and explicitly confirm the relationships (e.g., foreign keys, ownership, cardinality) between the new schema and the existing data model before finalizing the gate tasks.',
    )
  })
})

describe('T-R4-3.0.1.3: docs/core/phase-planning.md contains the Backward Stream Dependencies anti-pattern', () => {
  it('adds Backward Stream Dependencies guidance in the same Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPattern name="Backward Stream Dependencies">')
    expect(liveContent).toContain(
      'An earlier stream (or a specific task within it) is planned with dependencies on a later stream or task',
    )
    expect(liveContent).toContain(
      'an earlier letter stream (or any task within it) must never depend on a later letter stream.',
    )
  })
})

describe('T-R4-3.0.1.4: docs/core/phase-planning.md contains the Non-Sequential Stream Naming anti-pattern', () => {
  it('adds Non-Sequential Stream Naming guidance in the same Anti-Patterns XML block', async () => {
    const liveContent = await readFile(LIVE_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPattern name="Non-Sequential Stream Naming">')
    expect(liveContent).toContain(
      'Stream alphabetic order skips letters or is not in sequence',
    )
    expect(liveContent).toContain(
      'Always name streams in strict alphabetic sequence based on their execution order',
    )
  })
})

describe('T-R4-3.0.2.1: templates/docs/core/phase-planning.md matches docs/core/phase-planning.md exactly', () => {
  it('keeps the scaffolded phase planning module in sync with the live module', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_PATH, 'utf-8'),
      readFile(TEMPLATE_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
