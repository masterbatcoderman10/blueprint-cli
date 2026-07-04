import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const PROJECT_PROGRESS_PATH = resolve(REPO_ROOT, 'docs/project-progress.md')
const SRS_PATH = resolve(REPO_ROOT, 'docs/srs.md')

async function readProjectProgress(): Promise<string> {
  return readFile(PROJECT_PROGRESS_PATH, 'utf-8')
}

async function readSrs(): Promise<string> {
  return readFile(SRS_PATH, 'utf-8')
}

function readRequirementMetadataSection(content: string, heading: string): string {
  const startIndex = content.indexOf(`\n${heading}\n`)
  expect(startIndex).toBeGreaterThanOrEqual(0)

  const section = content.slice(startIndex + 1)
  const endMarkers = ['\n### ', '\n---\n\n## Data Schema']
    .map((marker) => section.indexOf(marker))
    .filter((index) => index > 0)

  expect(endMarkers.length).toBeGreaterThan(0)
  return section.slice(0, Math.min(...endMarkers))
}

describe('R11-6.D.3 completion bookkeeping', () => {
  it('T-R11-6.D.3.1 activates MAS-211 and MAS-212 after implementation and verification', async () => {
    const srs = await readSrs()
    const mas211 = readRequirementMetadataSection(srs, '### MAS-211')
    const mas212 = readRequirementMetadataSection(srs, '### MAS-212')

    expect(srs).toContain('| MAS-211 | Alignment-Complete Command | Must | active | Revision 11 |')
    expect(srs).toContain('| MAS-212 | In-Place Skill Migration Command | Must | active | Revision 11 |')

    expect(mas211).toContain('- Status: active')
    expect(mas211).toContain('Transitioned to active after Revision 11 Phase 6 completion and verification')
    expect(mas211).toContain('alignment-complete')
    expect(mas211).toContain('npm test')

    expect(mas212).toContain('- Status: active')
    expect(mas212).toContain('Transitioned to active after Revision 11 Phase 6 completion and verification')
    expect(mas212).toContain('migrate')
    expect(mas212).toContain('npm run release:pack:verify')
  })

  it('T-R11-6.D.3.2 records Phase 6 completion and durable Revision 11 completion history in project progress', async () => {
    const content = await readProjectProgress()

    expect(content).toContain('2026-07-03: Revision 11 Phase 6 — Migrate & Alignment-Complete Commands completed.')
    expect(content).toContain('Targeted Phase 6 command and doc-contract tests')
    expect(content).toContain('npm test')
    expect(content).toContain('npm run release:pack:verify')
    expect(content).toContain('1343 passed, 2 skipped; 189 files passed, 1 skipped')
    expect(content).toContain('R11 — Skill-Based Agent Surface ✓')
    expect(content).toContain('└── Phase 6 — Migrate & Alignment-Complete Commands ✓')
    expect(content).toContain('Identified Revision 11 — Skill-Based Agent Surface.')
    expect(content).toContain('MAS-211 and MAS-212 are active.')
  })
})
