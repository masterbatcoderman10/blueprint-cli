import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TEMPLATES_DIR = join(__dirname, '../../../templates')
const ANTI_PATTERNS_PATH = join(TEMPLATES_DIR, 'skills', 'blueprint', 'reference', 'anti-patterns.md')

describe('T-R11-1.0.3 — reference/anti-patterns.md shape spec', () => {
  it('T-R11-1.0.3.1: contains canonical AntiPatterns shape spec with wrapper, name=, BadExample, Why, and optional nodes', () => {
    expect(existsSync(ANTI_PATTERNS_PATH)).toBe(true)
    const content = readFileSync(ANTI_PATTERNS_PATH, 'utf-8')

    // Must contain the canonical wrapper
    expect(content).toContain('<AntiPatterns>')

    // Must specify bare name= attribute (no ANTI-PATTERN: prefix)
    expect(content).toMatch(/name=["']/)

    // Must specify required children
    expect(content).toContain('<BadExample>')
    expect(content).toContain('<Why>')

    // Must mention optional children
    expect(content).toContain('<GoodExample>')

    // Must mention that the block is never wrapped in a code fence
    expect(content.toLowerCase()).toMatch(/never.*fenced|not.*fenced|unfenced|never wrapped/)
  })

  it('T-R11-1.0.3.2: does not contain per-module anti-pattern registry entries', () => {
    const content = readFileSync(ANTI_PATTERNS_PATH, 'utf-8')

    // The file should be shape-spec only — the exemplar <AntiPattern> in the exemplar
    // is fine (it's part of the shape definition), but there should be no
    // module-specific named entries (e.g., no "Don't Rush", "Direct Tracker Database Mutation", etc.)
    const specificAntiPatterns = [
      "Don't Rush",
      'Direct Tracker Database Mutation',
      'Premature Milestone Declaration',
      'Orphan Phase',
      'Scope Creep',
    ]

    for (const name of specificAntiPatterns) {
      expect(content, `Shape-spec file should not contain module-specific entry "${name}"`).not.toContain(name)
    }

    // Should not contain behavioral rules beyond the shape definition
    expect(content).not.toMatch(/RULE\s+\d/)
    expect(content).not.toMatch(/HARD RULE/)
  })
})
