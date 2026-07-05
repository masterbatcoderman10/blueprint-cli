import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const FOUNDATION_PLANNING_PATHS = [
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
  join(ROOT_DIR, 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
]

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

describe('R12-3.A foundation planning artifact workflow', () => {
  it('T-R12-3.A.1.1: defines PRD Stage 1 as planning + plan-prd, product-scope-only interviewing, and a docs/prd.md draft', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('PRD Stage 1')
      expect(content).toContain('Load `reference/planning.md` and `reference/plan-prd.md`.')
      expect(content).toContain('Interview only for product scope.')
      expect(content).toContain('Draft the PRD Stage 1 body to `docs/prd.md`.')
      expect(content).toContain('Write only the PRD body sections that Stage 1 allows.')
    }
  })

  it('T-R12-3.A.1.2: blocks SRS until the PRD Stage 1 draft has gone through the full approval gate', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Present the `docs/prd.md` path and a concise summary to the user.')
      expect(content).toContain('Apply targeted edits to `docs/prd.md`.')
      expect(content).toContain('Get explicit approval on PRD Stage 1 before SRS begins.')
    }
  })

  it('T-R12-3.A.2.1: defines SRS drafting from approved PRD Stage 1, direct user Q&A, and the locked docs/srs.md path', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Load `reference/srs.md`.')
      expect(content).toContain('Use the approved PRD Stage 1 artifact plus direct user Q&A as SRS inputs.')
      expect(content).toContain('Derive stable requirement IDs under the `reference/srs.md` rules.')
      expect(content).toContain('Preserve the SRS structure and metadata rules from `reference/srs.md`.')
      expect(content).toContain('Draft the SRS to `docs/srs.md`.')
      expect(content).toContain('Do not rerun Alignment while drafting the SRS.')
    }
  })

  it('T-R12-3.A.2.2: blocks PRD Stage 2 until the SRS draft has gone through the full approval gate', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Present the `docs/srs.md` path and a concise summary to the user.')
      expect(content).toContain('Apply targeted edits to `docs/srs.md`.')
      expect(content).toContain('Get explicit approval on the SRS before returning to PRD Stage 2.')
    }
  })

  it('T-R12-3.A.3.1: defines PRD Stage 2 as a return to docs/prd.md for milestone projection from the approved SRS', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Reload `reference/plan-prd.md` for PRD Stage 2.')
      expect(content).toContain('Return to `docs/prd.md`.')
      expect(content).toContain('Project milestones from the approved SRS.')
      expect(content).toContain('Reference SRS IDs from milestone descriptions.')
      expect(content).toContain('Do not create milestone documents during PRD Stage 2.')
    }
  })

  it('T-R12-3.A.3.2: blocks project-progress until the PRD Stage 2 draft has gone through the full approval gate', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Present the `docs/prd.md` path and a concise summary for PRD Stage 2.')
      expect(content).toContain('Apply targeted milestone edits to `docs/prd.md`.')
      expect(content).toContain('Get explicit approval on PRD Stage 2 before project-progress begins.')
    }
  })

  it('T-R12-3.A.4.1: defines project-progress as the final artifact and the handoff into milestone planning', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('`docs/project-progress.md` is the final artifact.')
      expect(content).toContain('Populate the `docs/project-progress.md` shell last.')
      expect(content).toContain('Set the first PRD milestone as the current pending milestone-planning target.')
      expect(content).toContain('Keep the current phase at pending milestone planning.')
      expect(content).toContain('Populated progress unlocks normal Blueprint routing.')
    }
  })

  it('T-R12-3.A.4.2: requires the final project-progress artifact to go through the same explicit approval gate', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Present the `docs/project-progress.md` path and a concise summary to the user.')
      expect(content).toContain('Apply targeted edits to `docs/project-progress.md`.')
      expect(content).toContain('Get explicit approval on `docs/project-progress.md` before Foundation Planning is complete.')
    }
  })

  it('T-R12-3.A.4.3: keeps the final project-progress step out of downstream planning and tracker side effects', () => {
    for (const content of FOUNDATION_PLANNING_PATHS.map(read)) {
      expect(content).toContain('Do not create phase docs while finalizing `docs/project-progress.md`.')
      expect(content).toContain('Do not create test plans while finalizing `docs/project-progress.md`.')
      expect(content).toContain('Do not create tracker tasks while finalizing `docs/project-progress.md`.')
      expect(content).toContain('Do not mutate the board while finalizing `docs/project-progress.md`.')
    }
  })
})
