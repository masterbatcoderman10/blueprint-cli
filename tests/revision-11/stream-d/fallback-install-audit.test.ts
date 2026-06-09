import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(process.cwd())

const HISTORICAL_DOC_ALLOWLIST = [
  'docs/srs.md',
  'docs/milestones/revision-11-skill-based-agent-surface/phase-4-npx-install-pathway-and-release-surface.md',
] as const

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

describe('T-R11-4.D.2 — repo-wide fallback install audit', () => {
  const auditedDocs = readTrackedMarkdownFiles().filter(
    (relativePath) => !HISTORICAL_DOC_ALLOWLIST.includes(relativePath as (typeof HISTORICAL_DOC_ALLOWLIST)[number]),
  )

  it('T-R11-4.D.2.1: finds no stale Phase 4 fallback installer promises in audited docs', () => {
    const findings = auditedDocs.flatMap((relativePath) => {
      const content = readDoc(relativePath)

      return STALE_PROMISE_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(
        ({ label }) => `${relativePath}: ${label}`,
      )
    })

    expect(findings).toEqual([])
  })

  it('T-R11-4.D.2.2: keeps future first-party install references explicitly tied to Revision 11 Phase 6', () => {
    const offenders = auditedDocs.filter((relativePath) => {
      const content = readDoc(relativePath)
      return FUTURE_INSTALL_PATTERN.test(content) && !PHASE_6_PATTERN.test(content)
    })

    expect(offenders).toEqual([])
  })

  it('T-R11-4.D.2.3: excludes only historical planning context from the audit', () => {
    expect(HISTORICAL_DOC_ALLOWLIST).toContain(
      'docs/srs.md',
    )
    expect(HISTORICAL_DOC_ALLOWLIST).toContain(
      'docs/milestones/revision-11-skill-based-agent-surface/phase-4-npx-install-pathway-and-release-surface.md',
    )
    expect(HISTORICAL_DOC_ALLOWLIST).not.toContain('README.md')
    expect(HISTORICAL_DOC_ALLOWLIST).not.toContain('docs/release-contract.md')
    expect(HISTORICAL_DOC_ALLOWLIST).not.toContain('docs/releasing.md')
  })
})
