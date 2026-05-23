import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_SRS_PLANNING_PATH = join(ROOT_DIR, 'docs', 'core', 'srs-planning.md')
const TEMPLATE_SRS_PLANNING_PATH = join(
  ROOT_DIR,
  'templates',
  'docs',
  'core',
  'srs-planning.md',
)

describe('T-R4-2.A.1.1: docs/core/srs-planning.md warns against flat requirement lists', () => {
  it('places the guidance in a standalone Anti-Patterns section as an XML code block', async () => {
    const liveContent = await readFile(LIVE_SRS_PLANNING_PATH, 'utf-8')
    const antiPatternsIndex = liveContent.lastIndexOf('## Anti-Patterns')
    const srsExampleEndIndex = liveContent.indexOf('</SRSExample>')

    expect(antiPatternsIndex).toBeGreaterThan(-1)
    expect(srsExampleEndIndex).toBeGreaterThan(-1)
    expect(antiPatternsIndex).toBeGreaterThan(srsExampleEndIndex)
    expect(liveContent).toContain('<AntiPatterns>')
    expect(liveContent).toContain('<AntiPattern name="Flat Requirement Lists">')
    expect(liveContent).toContain(
      'The agent takes one MealBoard capability and explodes it into several top-level requirements that are really just parts of the same job.',
    )
    expect(liveContent).toContain(
      'SRS-101 - Recipe title capture - The system must allow users to enter a title when manually saving a recipe.',
    )
    expect(liveContent).toContain(
      'SRS-102 - Ingredient list capture - The system must allow users to enter ingredients when manually saving a recipe.',
    )
    expect(liveContent).toContain(
      'SRS-103 - Preparation step capture - The system must allow users to enter ordered steps when manually saving a recipe.',
    )
    expect(liveContent).toContain(
      'SRS-104 - Manual recipe record creation - The system must allow users to save the completed recipe as a new record.',
    )
    expect(liveContent).toContain(
      'SRS-001 - Manual recipe saving - The system must allow users to save recipes manually.',
    )
    expect(liveContent).toContain(
      'The system must capture a recipe title.',
    )
    expect(liveContent).toContain(
      'The system must capture an ingredient list.',
    )
    expect(liveContent).toContain(
      'The system must capture ordered preparation steps.',
    )
    expect(liveContent).toContain(
      'The bad split spends four top-level requirement IDs to describe one MealBoard capability. The good version names the capability once, then keeps the title, ingredients, and steps as sub-requirements where they belong.',
    )
  })
})

describe('T-R4-2.A.1.2: docs/core/srs-planning.md warns against checklist-style SRS execution', () => {
  it('keeps progressive clarification distinct from a checklist workflow', async () => {
    const liveContent = await readFile(LIVE_SRS_PLANNING_PATH, 'utf-8')

    expect(liveContent).toContain('<AntiPattern name="Checklist-Style SRS Execution">')
    expect(liveContent).toContain(
      'The agent turns the MealBoard manual-recipe flow into an implementation checklist and mistakes build steps for requirement meaning.',
    )
    expect(liveContent).toContain(
      'SRS-201 - Recipe title input field - Build a title input for manual recipe creation.',
    )
    expect(liveContent).toContain(
      'SRS-202 - Ingredient repeater - Build ingredient rows for manual recipe creation.',
    )
    expect(liveContent).toContain(
      'SRS-203 - Preparation step list - Build ordered step inputs for manual recipe creation.',
    )
    expect(liveContent).toContain(
      'SRS-204 - Manual recipe save action - Persist the completed recipe when the user presses save.',
    )
    expect(liveContent).toContain(
      'SRS-001 - Manual recipe saving - The system must allow users to save recipes manually.',
    )
    expect(liveContent).toContain(
      'A checklist writer describes what to build next and in what order. Progressive clarification describes enduring product truth first, then lets later planning layers decide implementation steps.',
    )
  })
})

describe('T-R4-2.A.2.1: templates/docs/core/srs-planning.md matches docs/core/srs-planning.md exactly', () => {
  it('keeps the scaffolded SRS planning module in sync with the live module', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_SRS_PLANNING_PATH, 'utf-8'),
      readFile(TEMPLATE_SRS_PLANNING_PATH, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
