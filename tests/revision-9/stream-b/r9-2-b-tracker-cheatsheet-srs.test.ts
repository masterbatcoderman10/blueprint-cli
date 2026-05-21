import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

async function readCoreDoc(name: string): Promise<string> {
  return readFile(join(ROOT_DIR, 'docs', 'core', name), 'utf-8')
}

/* ------------------------------------------------------------------ */
/*  T-R9-2.B.1  —  tracker.md cheatsheet-first structure               */
/* ------------------------------------------------------------------ */

describe('T-R9-2.B.1: tracker.md cheatsheet-first section order', () => {
  it('T-R9-2.B.1.1: heading-token sequence matches [Board lifecycle, Gated transitions, Comment recipes, Task creation, …deeper-detail]', async () => {
    const content = await readCoreDoc('tracker.md')

    // Extract all markdown headings (## or ###) in order
    const headings = [...content.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim())

    // The first four top-level (##) headings after the title must be in this order
    const h2Headings = headings.filter((h) => {
      // Only count ## headings (not ###)
      const line = content.split('\n').find((l) => l.trim().endsWith(h))
      return line && line.startsWith('## ') && !line.startsWith('### ')
    })

    // Normalize for comparison
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

    const expectedPrefix = [
      'board lifecycle',
      'gated transitions',
      'comment recipes',
      'task creation',
    ]

    for (let i = 0; i < expectedPrefix.length; i++) {
      expect(
        normalize(h2Headings[i]).startsWith(expectedPrefix[i]),
        `H2 heading ${i} should start with "${expectedPrefix[i]}", got "${h2Headings[i]}"`,
      ).toBe(true)
    }
  })

  it('T-R9-2.B.1.2: Board lifecycle section documents three subcommands, shared-lock path, duplicate-start refusal, and legacy-lock migration', async () => {
    const content = await readCoreDoc('tracker.md')

    // Extract the Board lifecycle section
    const lifecycleMatch = content.match(
      /## Board lifecycle[\s\S]*?(?=\n## Gated transitions|$)/,
    )
    expect(lifecycleMatch, 'Board lifecycle section should exist before Gated transitions').toBeTruthy()

    const section = lifecycleMatch![0]

    // Three subcommands
    expect(section).toMatch(/blueprint board stop/)
    expect(section).toMatch(/blueprint board status/)
    // start/default is implied by "blueprint board" or "start" subcommand
    expect(section).toMatch(/start/)

    // Shared-lock path
    expect(section).toMatch(/blueprint-board\.lock/)
    expect(section).toMatch(/git.common.dir|git-common-dir|gitCommonDir/i)

    // Duplicate-start refusal
    expect(section).toMatch(/duplicate|refus|already running/i)

    // Legacy-lock migration note
    expect(section).toMatch(/legacy|migration|migrate/i)
  })

  it('T-R9-2.B.1.3: Gated transitions section has curl recipe per verb — start/submit/approve/reject/resume', async () => {
    const content = await readCoreDoc('tracker.md')

    const gatedMatch = content.match(
      /## Gated transitions[\s\S]*?(?=\n## Comment recipes|$)/,
    )
    expect(gatedMatch, 'Gated transitions section should exist').toBeTruthy()

    const section = gatedMatch![0]

    const verbs = ['start', 'submit', 'approve', 'reject', 'resume']
    for (const verb of verbs) {
      // Must have POST method
      expect(section, `Gated section should have POST for "${verb}"`).toMatch(
        new RegExp(`curl -X POST.*\\/${verb}`),
      )
      // Must have URL fragment
      expect(section, `Gated section should have /tasks/:id/${verb} URL`).toMatch(
        new RegExp(`/tasks/[^\\s/]+/${verb}`),
      )
    }
  })

  it('T-R9-2.B.1.4: deeper-detail block retains PATCH reference marked non-canonical', async () => {
    const content = await readCoreDoc('tracker.md')

    // Find the deeper-detail area (after Task creation section)
    const deeperMatch = content.match(
      /## Task creation[\s\S]*$/s,
    )
    expect(deeperMatch, 'Content after Task creation should exist').toBeTruthy()

    const deeper = deeperMatch![0]

    // Must contain PATCH /tasks/:id
    expect(deeper).toMatch(/PATCH \/tasks\//)

    // Must mark PATCH as non-canonical for gated transitions
    expect(deeper).toMatch(/non.canonical|not the canonical|non-canonical/i)
  })
})

/* ------------------------------------------------------------------ */
/*  T-R9-2.B.3 & B.4  —  SRS MAS-204/MAS-205 change-log entries        */
/* ------------------------------------------------------------------ */

describe('T-R9-2.B.3/B.4: SRS MAS-204 and MAS-205 Phase 2 change-log entries', () => {
  const cases = [
    {
      id: 'MAS-204',
      expectedTokens: ['Phase 2', 'unchanged', 'MAS-205'],
      description: 'no server-surface change, board lifecycle owned by MAS-205',
    },
    {
      id: 'MAS-205',
      expectedTokens: ['Phase 2', 'board stop', 'board status', 'shared lock', 'duplicate'],
      description: 'lifecycle elaboration with stop, status, shared lock, duplicate refusal',
    },
  ]

  for (const { id, expectedTokens, description } of cases) {
    it(`T-R9-2.B.3.1 (${id}): ${description}`, async () => {
      const content = await readFile(join(ROOT_DIR, 'docs', 'srs.md'), 'utf-8')

      // Extract the MAS section
      const sectionRegex = new RegExp(`\\n### ${id}[\\s\\S]*?(?=\\n### MAS-|\\n## |$)`)
      const sectionMatch = content.match(sectionRegex)
      expect(sectionMatch, `${id} section should exist`).toBeTruthy()

      const section = sectionMatch![0]

      // New Phase 2 entry present
      expect(section).toContain('Phase 2')
      expect(section).toContain('Revision 9')

      // Required tokens
      for (const token of expectedTokens) {
        expect(section, `${id} should contain token "${token}"`).toMatch(
          new RegExp(token, 'i'),
        )
      }

      // Prior entries preserved — check for at least one pre-R9 entry
      const priorEntries = section.match(/2026-0[1-4]|2026-05-1[7-9]|2026-05-20/g)
      expect(
        priorEntries && priorEntries.length > 0,
        `${id} should preserve prior change-log entries`,
      ).toBe(true)
    })
  }
})
