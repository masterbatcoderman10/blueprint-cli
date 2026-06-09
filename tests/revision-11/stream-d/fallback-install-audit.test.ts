import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(process.cwd())

const STALE_PROMISE_PATTERNS = [
  { label: 'blueprint-skill-install', pattern: /blueprint-skill-install/ },
  { label: 'bundled fallback installer', pattern: /bundled fallback installer/i },
  { label: 'fallback is our own bundled', pattern: /fallback is our own bundled/i },
  { label: 'postinstall hook', pattern: /postinstall hook/i },
  { label: 'npm-bin fallback', pattern: /npm-bin fallback/i },
  { label: 'alternate npm-bin install surface', pattern: /alternate npm-bin install surface/i },
  { label: 'bin/blueprint-skill-install', pattern: /bin\/blueprint-skill-install/i },
] as const

const FUTURE_INSTALL_PATTERN = /first-party CLI install option/i
const PHASE_6_PATTERN = /Revision 11 Phase 6/
const NEGATION_CUES = [
  /\bno\b/i,
  /\bnot\b/i,
  /\bwithout\b/i,
  /\bdoes not\b/i,
  /\bdon't\b/i,
  /\bdoesn't\b/i,
  /\bis not\b/i,
  /\bare not\b/i,
  /\bdeferred\b/i,
  /\bout of scope\b/i,
  /\bremove\b/i,
  /\bnot part of this phase\b/i,
] as const

function readTrackedMarkdownFiles(): string[] {
  return execFileSync('git', ['ls-files', '*.md'], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function readDoc(relativePath: string): string {
  return readFileSync(resolve(ROOT_DIR, relativePath), 'utf-8')
}

function readRequirementSection(content: string, requirementId: string): string {
  const heading = `### ${requirementId}`
  const startIndex = content.indexOf(heading)
  expect(startIndex).toBeGreaterThanOrEqual(0)

  const section = content.slice(startIndex)
  const endIndex = section.indexOf('\n---\n\n## Data Schema')
  expect(endIndex).toBeGreaterThanOrEqual(0)

  return section.slice(0, endIndex)
}

function hasNegationCue(prefix: string): boolean {
  return NEGATION_CUES.some((pattern) => pattern.test(prefix))
}

function collectStalePromiseFindings(relativePath: string, content: string): string[] {
  return content.split(/\r?\n/).flatMap((line, lineIndex) => {
    return STALE_PROMISE_PATTERNS.flatMap(({ label, pattern }) => {
      const matchIndex = line.search(pattern)
      if (matchIndex === -1) {
        return []
      }

      const prefix = line.slice(0, matchIndex)
      if (hasNegationCue(prefix)) {
        return []
      }

      return [`${relativePath}:${lineIndex + 1}: ${label}`]
    })
  })
}

describe('T-R11-4.D.2 — repo-wide fallback install audit', () => {
  const auditedDocs = readTrackedMarkdownFiles()

  it('T-R11-4.D.2.1: finds no stale Phase 4 fallback installer promises in audited docs', () => {
    const findings = auditedDocs.flatMap((relativePath) => collectStalePromiseFindings(relativePath, readDoc(relativePath)))

    expect(findings).toEqual([])
  })

  it('T-R11-4.D.2.2: keeps future first-party install references explicitly tied to Revision 11 Phase 6', () => {
    const offenders = auditedDocs.flatMap((relativePath) => {
      const content = readDoc(relativePath)

      return content.split(/\r?\n/).flatMap((line, lineIndex) => {
        if (!FUTURE_INSTALL_PATTERN.test(line) || PHASE_6_PATTERN.test(line)) {
          return []
        }

        return [`${relativePath}:${lineIndex + 1}`]
      })
    })

    expect(offenders).toEqual([])
  })

  it('T-R11-4.D.2.3: includes active Phase 4 planning and SRS docs in the repo-wide audit surface', () => {
    expect(auditedDocs).toContain('docs/project-progress.md')
    expect(auditedDocs).toContain('docs/srs.md')
    expect(auditedDocs).toContain(
      'docs/milestones/revision-11-skill-based-agent-surface/phase-4-npx-install-pathway-and-release-surface.md',
    )
  })
})

describe('T-R11-4.D.3 — MAS-210 activation boundary', () => {
  it('T-R11-4.D.3.1: activates MAS-210 and preserves its change log with the manual-smoke completion entry', () => {
    const srs = readDoc('docs/srs.md')
    const mas210 = readRequirementSection(srs, 'MAS-210')

    expect(srs).toContain('| MAS-210 | NPX Skill Install Pathway | Must | active | Revision 11 |')
    expect(mas210).toContain('- Status: active')
    expect(mas210).toContain(
      '2026-06-09 - Created from Revision 11 Phase 4 planning (pre-phase SRS repair, per user direction to land SRS updates before phase doc commits rather than as in-phase tasks). Locked sub-detail bullets recorded: single supported Phase 4 install path is `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`; `vercel-labs/skills` discovery surface is repo-root `skills/blueprint/**`; `templates/skills/blueprint/**` remains authoritative while `skills/blueprint/**` is a byte-identical mirror; the mirrored payload includes 23 files (`SKILL.md`, 20 renamed `reference/*.md`, shared `reference/anti-patterns.md`, `scripts/load-context.mjs`); the npm tarball must ship `skills/blueprint/**` and release verification must enforce it; README and release docs must recommend project-local install and document the current `-g` sharp edge; no bundled fallback installer is included in Phase 4; real GitHub install verification is manual smoke only. Status remains `approved-pending-implementation` until Revision 11 Phase 4 completion.',
    )
    expect(mas210).toContain(
      '2026-06-09 - Transitioned to active after manual smoke against public ref `r11-4-phase4-smoke` at commit `98e36d81dde09b6ce46693899aed6e43b6216c7d` using `npx skills add masterbatcoderman10/blueprint-cli#r11-4-phase4-smoke --skill blueprint -y --copy`; verified project-local `.claude/skills/blueprint/` and no unrelated scaffold.',
    )
  })
})
