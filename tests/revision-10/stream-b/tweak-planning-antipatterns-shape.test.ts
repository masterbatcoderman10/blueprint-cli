/**
 * T-R10-2.B — Integration test for Stream B: Anti-Pattern Shape Unification
 * in docs/core/tweak-planning.md.
 *
 * Five assertions:
 *   1. Zero occurrences of the <TweakAntiPatterns> token (opener or closer).
 *   2. Exactly one <AntiPatterns> block.
 *   3. Exactly 8 <AntiPattern name="..."> entries.
 *   4. Entry names match the locked list in source order.
 *   5. Each of the 8 entries contains exactly one <BadExample> child and
 *      exactly one <Why> child.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..')
const TWEAK_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'tweak-planning.md')

async function readDoc(): Promise<string> {
  return readFile(TWEAK_PLANNING_PATH, 'utf8')
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

const LOCKED_NAMES = [
  'Creating Tracker Tasks for a Tweak',
  'Writing Tweak Doc Before Change',
  'Loading Planning Modules in Tweak Mode',
  'Carving Tweak into Gates or Streams',
  'Drafting Formal Test Plan for Tweak',
  'Skipping Change-First Confirm Step',
  'Skipping npm test Before Doc Creation',
  'Continuing in Tweak Mode After Escalation',
] as const

describe('T-R10-2.B: tweak-planning.md anti-patterns shape unification', () => {
  it('contains zero occurrences of the <TweakAntiPatterns> token', async () => {
    const content = await readDoc()
    expect(content).not.toContain('<TweakAntiPatterns>')
    expect(content).not.toContain('</TweakAntiPatterns>')
  })

  it('contains exactly one <AntiPatterns> block', async () => {
    const content = await readDoc()
    const openerCount = (content.match(/<AntiPatterns>/g) ?? []).length
    const closerCount = (content.match(/<\/AntiPatterns>/g) ?? []).length
    expect(openerCount, 'Exactly one <AntiPatterns> opener').toBe(1)
    expect(closerCount, 'Exactly one </AntiPatterns> closer').toBe(1)
  })

  it('the <AntiPatterns> block contains exactly 8 <AntiPattern name="..."> entries', async () => {
    const content = await readDoc()
    const block = extractBlock(content, 'AntiPatterns')
    expect(block, '<AntiPatterns> block must be present').not.toBeNull()
    const entryNameRegex = /<AntiPattern name="([^"]+)">/g
    const foundNames: string[] = []
    let match: RegExpExecArray | null
    while ((match = entryNameRegex.exec(block ?? '')) !== null) {
      foundNames.push(match[1])
    }
    expect(foundNames, 'Must contain exactly 8 entries').toHaveLength(8)
  })

  it('entry names match the locked list in source order', async () => {
    const content = await readDoc()
    const block = extractBlock(content, 'AntiPatterns')
    expect(block, '<AntiPatterns> block must be present').not.toBeNull()
    const entryNameRegex = /<AntiPattern name="([^"]+)">/g
    const foundNames: string[] = []
    let match: RegExpExecArray | null
    while ((match = entryNameRegex.exec(block ?? '')) !== null) {
      foundNames.push(match[1])
    }
    expect(foundNames).toEqual([...LOCKED_NAMES])
  })

  it('each of the 8 entries contains exactly one <BadExample> and one <Why> child', async () => {
    const content = await readDoc()
    const block = extractBlock(content, 'AntiPatterns')
    expect(block, '<AntiPatterns> block must be present').not.toBeNull()

    // Split into individual <AntiPattern> entries
    const entryRegex = /<AntiPattern name="[^"]+">([\s\S]*?)<\/AntiPattern>/g
    let entryMatch: RegExpExecArray | null
    const entries: string[] = []
    while ((entryMatch = entryRegex.exec(block ?? '')) !== null) {
      entries.push(entryMatch[1])
    }

    expect(entries, 'Must find exactly 8 entry bodies').toHaveLength(8)

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const badExampleCount = (entry.match(/<BadExample>/g) ?? []).length
      const whyCount = (entry.match(/<Why>/g) ?? []).length
      expect(badExampleCount, `Entry ${i} must have exactly one <BadExample>`).toBe(1)
      expect(whyCount, `Entry ${i} must have exactly one <Why>`).toBe(1)
    }
  })
})
