import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = join(__dirname, '../../..')
const TEMPLATES_DIR = join(ROOT_DIR, 'templates')
const DOCS_CORE_DIR = join(ROOT_DIR, 'docs', 'core')
const REFERENCE_DIR = join(TEMPLATES_DIR, 'skills', 'blueprint', 'reference')

/**
 * Locked rename map: target reference file ← source docs/core file
 * Key = reference filename (slug), Value = source docs/core filename
 */
const RENAME_MAP: Record<string, string> = {
  'align': 'alignment.md',
  'blueprint-structure': 'blueprint-structure.md',
  'bug': 'bug-resolution.md',
  'commit': 'git-execution-workflow.md',
  'commit-review': 'git-review-workflow.md',
  'execute': 'execution.md',
  'hierarchy': 'hierarchy.md',
  'orchestrate': 'orchestrate.md',
  'phase-complete': 'phase-completion.md',
  'plan-milestone': 'milestone-planning.md',
  'plan-phase': 'phase-planning.md',
  'plan-prd': 'prd-planning.md',
  'plan-test': 'test-planning.md',
  'planning': 'planning.md',
  'review': 'review.md',
  'revision': 'revision-planning.md',
  'scope-change': 'scope-change.md',
  'srs': 'srs-planning.md',
  'tracker': 'tracker.md',
  'tweak': 'tweak-planning.md',
}

/** Parse frontmatter from a file with --- delimiters. Returns { frontmatter, body } or null. */
function parseFrontmatter(content: string): { frontmatter: string; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null
  return { frontmatter: match[1], body: match[2] }
}

/**
 * Route-specific description keywords — each reference file's description
 * must contain at least one of these keywords to be specific enough to
 * disambiguate routing intent from adjacent modules.
 */
const ROUTE_KEYWORDS: Record<string, string[]> = {
  'align': ['align', 'alignment'],
  'blueprint-structure': ['blueprint structure', 'docs structure', 'folder layout'],
  'bug': ['bug', 'broken'],
  'commit': ['commit', 'git execution', 'git workflow'],
  'commit-review': ['review workflow', 'git review', 'commit review'],
  'execute': ['execute', 'execution'],
  'hierarchy': ['hierarchy', 'five-level'],
  'orchestrate': ['orchestrat'],
  'phase-complete': ['phase completion', 'phase-complete'],
  'plan-milestone': ['milestone plan', 'plan.*milestone'],
  'plan-phase': ['phase plan', 'plan.*phase'],
  'plan-prd': ['prd', 'product requirements'],
  'plan-test': ['test plan', 'plan.*test'],
  'planning': ['planning'],
  'review': ['review gate', 'review stream'],
  'revision': ['revision', 'change existing'],
  'scope-change': ['scope change', 'new feature'],
  'srs': ['srs', 'software requirements'],
  'tracker': ['tracker', 'task tracker'],
  'tweak': ['tweak', 'quick change'],
}

// ─── T-R11-1.A.1.1: Parameterized frontmatter validation ───

describe('T-R11-1.A.1.1 — Frontmatter name and description validation (parameterized)', () => {
  for (const [slug, sourceFile] of Object.entries(RENAME_MAP)) {
    it(`reference/${slug}.md: frontmatter name matches slug, description is single-line and route-specific`, () => {
      const refPath = join(REFERENCE_DIR, `${slug}.md`)
      expect(existsSync(refPath), `reference/${slug}.md must exist`).toBe(true)

      const content = readFileSync(refPath, 'utf-8')
      const parsed = parseFrontmatter(content)
      expect(parsed, `reference/${slug}.md must have valid frontmatter block`).not.toBeNull()

      // name must match the filename slug
      const nameMatch = parsed!.frontmatter.match(/^name:\s*(.+)$/m)
      expect(nameMatch, `frontmatter must have a name field`).not.toBeNull()
      expect(nameMatch![1].trim()).toBe(slug)

      // description must exist and be single-line
      const descMatch = parsed!.frontmatter.match(/^description:\s*(.+)$/m)
      expect(descMatch, `frontmatter must have a description field`).not.toBeNull()
      const description = descMatch![1].trim()
      expect(description.length, `description must not be empty`).toBeGreaterThan(0)

      // description must not contain newlines (single-line)
      expect(description).not.toMatch(/\n/)

      // description must be route-specific — contain keywords that disambiguate
      const keywords = ROUTE_KEYWORDS[slug]
      const descLower = description.toLowerCase()
      const hasKeyword = keywords.some(kw => new RegExp(kw, 'i').test(descLower))
      expect(
        hasKeyword,
        `description "${description}" must contain route-specific keywords: ${keywords.join(', ')}`
      ).toBe(true)
    })
  }
})

// ─── T-R11-1.A.1.2: AntiPatterns canonical shape validation ───

describe('T-R11-1.A.1.2 — AntiPatterns block canonical shape (parameterized)', () => {
  // Read the canonical shape spec for reference
  const antiPatternsSpec = readFileSync(join(REFERENCE_DIR, 'anti-patterns.md'), 'utf-8')

  for (const [slug, sourceFile] of Object.entries(RENAME_MAP)) {
    const refPath = join(REFERENCE_DIR, `${slug}.md`)

    // Only test files that actually contain AntiPatterns blocks
    if (!existsSync(refPath)) continue
    const content = readFileSync(refPath, 'utf-8')
    if (!content.includes('<AntiPatterns>')) continue

    it(`reference/${slug}.md: AntiPatterns block conforms to canonical shape`, () => {
      const body = parseFrontmatter(content)?.body ?? content

      // Must use <AntiPatterns> wrapper (not <TweakAntiPatterns> or other variants)
      expect(body).toContain('<AntiPatterns>')
      expect(body).not.toContain('<TweakAntiPatterns>')

      // Every <AntiPattern> must have a bare name= attribute (no ANTI-PATTERN: prefix)
      const antiPatternMatches = body.matchAll(/<AntiPattern\s+([^>]*)>/g)
      for (const match of antiPatternMatches) {
        const attrs = match[1]
        const nameMatch = attrs.match(/name=["']([^"']+)["']/)
        expect(nameMatch, `AntiPattern must have a name attribute`).not.toBeNull()
        expect(nameMatch![1], `AntiPattern name must not have ANTI-PATTERN: prefix`).not.toMatch(/^ANTI-PATTERN:/)
      }

      // Must have required children: <BadExample> and <Why>
      // Extract the AntiPatterns block(s)
      const antiPatternsBlocks = body.match(/<AntiPatterns>[\s\S]*?<\/AntiPatterns>/g)
      expect(antiPatternsBlocks, `Must have at least one <AntiPatterns> block`).not.toBeNull()

      for (const block of antiPatternsBlocks!) {
        const antiPatternEntries = block.match(/<AntiPattern[\s\S]*?<\/AntiPattern>/g)
        expect(antiPatternEntries, `Block must contain at least one <AntiPattern> entry`).not.toBeNull()

        for (const entry of antiPatternEntries!) {
          expect(entry, `Each AntiPattern must have <BadExample>`).toContain('<BadExample>')
          expect(entry, `Each AntiPattern must have <Why>`).toContain('<Why>')
        }
      }

      // Must NOT be wrapped in a ```xml fence
      // Check for ```xml immediately before <AntiPatterns>
      const fencePattern = /```xml\s*\n\s*<AntiPatterns>/
      expect(body, `AntiPatterns block must not be wrapped in a code fence`).not.toMatch(fencePattern)
    })
  }
})

// ─── T-R11-1.A.1 through T-R11-1.A.20: Individual mirror tests ───

describe('T-R11-1.A mirror tests — byte-identical body verification', () => {
  for (const [slug, sourceFile] of Object.entries(RENAME_MAP)) {
    it(`T-R11-1.A.${Object.keys(RENAME_MAP).indexOf(slug) + 1}: reference/${slug}.md mirrors docs/core/${sourceFile}`, () => {
      const refPath = join(REFERENCE_DIR, `${slug}.md`)
      const sourcePath = join(DOCS_CORE_DIR, sourceFile)

      // Both files must exist
      expect(existsSync(refPath), `reference/${slug}.md must exist`).toBe(true)
      expect(existsSync(sourcePath), `docs/core/${sourceFile} must exist`).toBe(true)

      const refContent = readFileSync(refPath, 'utf-8')
      const sourceContent = readFileSync(sourcePath, 'utf-8')

      // Parse frontmatter from reference file
      const parsed = parseFrontmatter(refContent)
      expect(parsed, `reference/${slug}.md must have valid frontmatter`).not.toBeNull()

      // Body after frontmatter must be byte-identical to source
      expect(parsed!.body).toBe(sourceContent)
    })
  }
})
