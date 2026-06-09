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
