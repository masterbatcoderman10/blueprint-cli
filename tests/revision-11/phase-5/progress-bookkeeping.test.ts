import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const PROJECT_PROGRESS_PATH = resolve(REPO_ROOT, 'docs/project-progress.md')

async function readProjectProgress(): Promise<string> {
  return readFile(PROJECT_PROGRESS_PATH, 'utf-8')
}

describe('R11-5.E.2 project-progress bookkeeping', () => {
  it('T-R11-5.E.2.1 records Phase 5 completion with dogfood evidence and verification commands', async () => {
    const content = await readProjectProgress()

    expect(content).toContain('2026-06-11: Revision 11 Phase 5 — Dogfood & Cross-Reference Verification completed.')
    expect(content).toContain('.claude/skills/blueprint/scripts/load-context.mjs')
    expect(content).toContain('docs/tweaks/tweak-6-skill-mode-tweak-example.md')
    expect(content).toContain('npm test -- tests/revision-11/phase-5')
    expect(content).toContain('npm run release:pack:verify')
    expect(content).toContain('1314 passed, 2 skipped; 182 files passed, 1 skipped')
  })

  it('T-R11-5.E.2.2 marks Phase 5 complete and points the current status at Phase 6 pending planning', async () => {
    const content = await readProjectProgress()

    expect(content).toContain('**Current Milestone**: Revision 11 — Skill-Based Agent Surface (Phase 6 pending planning)')
    expect(content).toContain('**Current Phase**: TBD — pending phase planning')
    expect(content).toContain(
      '**Status**: Revision 11 Phase 5 — Dogfood & Cross-Reference Verification is complete. Next step: plan Revision 11 Phase 6 — Migrate & Alignment-Complete Commands.',
    )
    expect(content).toContain('├── Phase 5 — Dogfood & Cross-Reference Verification ✓')
    expect(content).toContain('└── Phase 6 — Migrate & Alignment-Complete Commands ○')
  })

  it('T-R11-5.E.2.3 updates the pending revisions row to Phase 6 pending planning', async () => {
    const content = await readProjectProgress()
    const pendingRevisionsSection = content.split('## Pending Revisions')[1] ?? ''

    expect(content).toContain('| R11 | Skill-Based Agent Surface | Phase 6 pending planning |')
    expect(content).toContain(
      'Phases 1, 2, 3, 4, and 5 complete. Next: Phase 6 — Migrate & Alignment-Complete Commands (not yet planned).',
    )
    expect(pendingRevisionsSection).not.toContain('Phase 5 pending planning')
  })
})
