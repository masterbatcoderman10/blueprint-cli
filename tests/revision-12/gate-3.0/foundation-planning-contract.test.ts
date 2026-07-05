import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const TEMPLATE_FOUNDATION_PLANNING_PATH = join(
  ROOT_DIR,
  'templates',
  'skills',
  'blueprint',
  'reference',
  'foundation-planning.md',
)
const ROOT_FOUNDATION_PLANNING_PATH = join(
  ROOT_DIR,
  'skills',
  'blueprint',
  'reference',
  'foundation-planning.md',
)
const FOUNDATION_PLANNING_PATHS = [
  TEMPLATE_FOUNDATION_PLANNING_PATH,
  ROOT_FOUNDATION_PLANNING_PATH,
]

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

describe('R12-3.0 foundation planning contract canon', () => {
  it('T-R12-3.0.1.1: describes Foundation Planning as a live workflow rather than a Phase 1 placeholder', () => {
    const content = read(TEMPLATE_FOUNDATION_PLANNING_PATH)

    expect(content).toContain('Foundation Planning is a complete workflow')
    expect(content).toContain('PRD Stage 1')
    expect(content).toContain('SRS')
    expect(content).toContain('PRD Stage 2')
    expect(content).toContain('project-progress')
    expect(content).toContain('explicit approval')
    expect(content).not.toContain('Phase 1 only establishes')
    expect(content).not.toContain('future workflow')
    expect(content).not.toContain('workflow remains Phase 3 work')
  })

  it('T-R12-3.0.1.2: makes the stop-state matrix explicit and allows only alignment-complete plus empty progress to proceed', () => {
    const content = read(TEMPLATE_FOUNDATION_PLANNING_PATH)

    expect(content).toMatch(/Only `alignment-complete` plus\s+empty progress may proceed\./)
    expect(content).toContain('If `alignment-required` is present, STOP and redirect to Alignment.')
    expect(content).toMatch(/If progress is already populated, STOP and route to normal\s+planning\/revision workflows\./)
    expect(content).toMatch(/If progress is empty and no supported marker is present, STOP with\s+repair guidance\./)
    expect(content).toMatch(/If required setup blocks are missing or incomplete, STOP without\s+repairing them\./)
    expect(content).toMatch(/If the tracker is missing or unavailable, STOP and instruct the user\s+to run `blueprint init`\./)
  })

  it('T-R12-3.0.1.3: names the required context sources and locked planning references', () => {
    const content = read(TEMPLATE_FOUNDATION_PLANNING_PATH)
    const contextSection =
      content.match(/<FoundationPlanningContext>([\s\S]*?)<\/FoundationPlanningContext>/)?.[1] ?? ''
    const srsSection =
      content.match(/<FoundationPlanningSRS>([\s\S]*?)<\/FoundationPlanningSRS>/)?.[1] ?? ''

    expect(content).toMatch(/Foundation Planning begins from existing project files and approved setup\s+blocks\./)
    expect(content).toContain('<ProjectConventions>')
    expect(content).toContain('<AgentOrchestration>')
    expect(contextSection).toContain('Load `reference/planning.md` for one-document planning discipline.')
    expect(contextSection).toContain('Load `reference/plan-prd.md` for PRD-specific rules.')
    expect(contextSection).not.toContain('Load `reference/srs.md`')
    expect(srsSection).toContain('Load `reference/srs.md`.')
    expect(content).toMatch(/reopen setup interviewing when the approved setup blocks are already\s+present/)
  })

  it('T-R12-3.0.1.4: keeps Foundation Planning read-only with respect to setup state and downstream planning surfaces', () => {
    const content = read(TEMPLATE_FOUNDATION_PLANNING_PATH)

    expect(content).toContain('Foundation Planning reads marker state only.')
    expect(content).toContain('Alignment owns marker mutation and setup repair.')
    expect(content).toContain('no milestone docs')
    expect(content).toContain('no phase docs')
    expect(content).toContain('no test plans')
    expect(content).toContain('no tracker tasks')
    expect(content).toContain('no board mutations')
    expect(content).toContain('no `docs/core/foundation-planning.md`')
    expect(content).toContain('no `templates/docs/core/foundation-planning.md`')
    expect(content).not.toMatch(/Load `reference\/plan-test\.md`/)
  })

  it('T-R12-3.0.2.1: keeps the repo-root Foundation Planning skill mirror byte-identical to the template source', () => {
    expect(read(ROOT_FOUNDATION_PLANNING_PATH)).toBe(read(TEMPLATE_FOUNDATION_PLANNING_PATH))
  })
})
