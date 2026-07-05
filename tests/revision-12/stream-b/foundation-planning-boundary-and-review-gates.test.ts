import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const FOUNDATION_PLANNING_SURFACES = [
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
  join(ROOT_DIR, 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
]

const STOP_OUTCOME_SNIPPETS = [
  'If the tracker is missing or unavailable, STOP and instruct the user',
  'If required setup blocks are missing or incomplete, STOP without',
  'If `alignment-required` is present, STOP and redirect to Alignment.',
  'If progress is already populated, STOP and route to normal',
  'If progress is empty and no supported marker is present, STOP with',
]

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

describe('R12-3.B foundation planning boundary and review-gate coverage', () => {
  it('T-R12-3.B.1.1: allows only the alignment-complete plus empty-progress bootstrap path and hard-stops every other stop-state before artifact drafting', () => {
    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)

      expect(content, surfacePath).toMatch(/Only `alignment-complete` plus\s+empty progress may proceed\./)

      for (const snippet of STOP_OUTCOME_SNIPPETS) {
        expect(content, `${surfacePath} :: ${snippet}`).toContain(snippet)
      }

      expect(content, surfacePath).toMatch(
        /If any precondition fails, do not draft or update PRD, SRS, or\s+project-progress\./,
      )
    }
  })

  it('T-R12-3.B.1.2: requires both setup blocks and stops on missing or incomplete setup without attempting repair', () => {
    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)

      expect(content, surfacePath).toContain('<ProjectConventions>')
      expect(content, surfacePath).toContain('<AgentOrchestration>')
      expect(content, surfacePath).toContain('required setup blocks exist and are complete:')
      expect(content, surfacePath).toContain('Foundation Planning reads marker state only.')
      expect(content, surfacePath).toContain('Alignment owns marker mutation and setup repair.')
      expect(content, surfacePath).toContain('Foundation Planning does not rewrite supported root files.')
      expect(content, surfacePath).not.toContain('repair missing setup blocks')
    }
  })

  it('T-R12-3.B.2.1: locks artifact sequencing to PRD Stage 1, then SRS, then PRD Stage 2, then project-progress with no batching', () => {
    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)
      const stage1Index = content.indexOf('1. PRD Stage 1')
      const srsIndex = content.indexOf('2. SRS')
      const stage2Index = content.indexOf('3. PRD Stage 2')
      const progressIndex = content.indexOf('4. project-progress')

      expect(content, surfacePath).toContain('PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress')
      expect(stage1Index, surfacePath).toBeGreaterThan(-1)
      expect(srsIndex, surfacePath).toBeGreaterThan(stage1Index)
      expect(stage2Index, surfacePath).toBeGreaterThan(srsIndex)
      expect(progressIndex, surfacePath).toBeGreaterThan(stage2Index)
      expect(content, surfacePath).toContain('do not skip artifacts')
      expect(content, surfacePath).toContain('do not reorder artifacts')
      expect(content, surfacePath).toContain('do not batch artifacts together')
    }
  })

  it('T-R12-3.B.2.2: requires the per-artifact draft, path summary, targeted edit, and explicit approval gate before every transition', () => {
    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)
      const draftIndex = content.indexOf('- draft to disk')
      const summaryIndex = content.indexOf('- present the path and a concise summary to the user')
      const editIndex = content.indexOf('- apply targeted edits')
      const approvalIndex = content.indexOf('- get explicit approval')
      const advanceIndex = content.indexOf('- only then move to the next artifact')

      expect(draftIndex, surfacePath).toBeGreaterThan(-1)
      expect(summaryIndex, surfacePath).toBeGreaterThan(draftIndex)
      expect(editIndex, surfacePath).toBeGreaterThan(summaryIndex)
      expect(approvalIndex, surfacePath).toBeGreaterThan(editIndex)
      expect(advanceIndex, surfacePath).toBeGreaterThan(approvalIndex)
      expect(content, surfacePath).toMatch(
        /Do not advance to the next artifact until the current artifact has\s+explicit approval\./,
      )
      expect(content, surfacePath).toMatch(
        /If context becomes crowded, stop and continue in a fresh session rather\s+than batching more than one artifact\./,
      )
    }
  })

  it('T-R12-3.B.3.1: keeps the explicit non-goals locked around milestone, phase, test-plan, tracker, and board boundaries', () => {
    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)

      expect(content, surfacePath).toContain('no milestone docs')
      expect(content, surfacePath).toContain('no phase docs')
      expect(content, surfacePath).toContain('no test plans')
      expect(content, surfacePath).toContain('no tracker tasks')
      expect(content, surfacePath).toContain('no board mutations')
      expect(content, surfacePath).toContain(
        'keep milestone and phase document creation for later workflows',
      )
    }
  })

  it('T-R12-3.B.3.2: keeps Foundation Planning out of legacy-core, tracker, board, and test-planning surfaces', () => {
    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(false)

    for (const surfacePath of FOUNDATION_PLANNING_SURFACES) {
      const content = read(surfacePath)

      expect(content, surfacePath).toContain('no `docs/core/foundation-planning.md`')
      expect(content, surfacePath).toContain('no `templates/docs/core/foundation-planning.md`')
      expect(content, surfacePath).not.toContain('Load `reference/plan-test.md`')
      expect(content, surfacePath).not.toContain('POST /tasks')
      expect(content, surfacePath).not.toContain('blueprint board')
    }
  })
})
