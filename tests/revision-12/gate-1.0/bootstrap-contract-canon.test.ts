import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = join(__dirname, '..', '..', '..')
const SKILL_MD_PATHS = [
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'SKILL.md'),
  join(ROOT_DIR, 'skills', 'blueprint', 'SKILL.md'),
]
const FOUNDATION_PLANNING_PATHS = [
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
  join(ROOT_DIR, 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
]
const LEGACY_ROOT_SURFACES = [
  join(ROOT_DIR, 'templates', 'CLAUDE.md'),
  join(ROOT_DIR, 'templates', 'AGENTS.md'),
  join(ROOT_DIR, 'templates', 'GEMINI.md'),
  join(ROOT_DIR, 'templates', 'QWEN.md'),
]
const BOOTSTRAP_OUTCOMES = [
  ['missing scaffold or tracker', 'STOP with install/init guidance'],
  ['empty progress + `alignment-required`', 'Alignment only'],
  ['empty progress + `alignment-complete`', 'Foundation Planning only'],
  ['populated progress + `alignment-required`', 'rerun or repair Alignment'],
  ['populated progress + no marker', 'normal routing'],
  ['empty progress + no marker', 'repair guidance'],
] as const

describe('R12-1.0 bootstrap contract canon', () => {
  it('T-R12-1.0.1.1: describes all six bootstrap states and their route outcomes', () => {
    for (const skillPath of SKILL_MD_PATHS) {
      const content = readFileSync(skillPath, 'utf-8')

      for (const [state, outcome] of BOOTSTRAP_OUTCOMES) {
        expect(content).toContain(state)
        expect(content).toContain(outcome)
      }

      expect(content).not.toContain('populated progress required')
    }
  })

  it('T-R12-1.0.1.2: adds Foundation Planning only on the skill surface and keeps legacy/core routing unchanged', () => {
    for (const skillPath of SKILL_MD_PATHS) {
      const content = readFileSync(skillPath, 'utf-8')
      const routeMatches = content.match(
        /\|\s*Foundation Planning\s*\|\s*`reference\/foundation-planning\.md`/g,
      )

      expect(routeMatches).toHaveLength(1)
    }

    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(false)

    for (const surfacePath of LEGACY_ROOT_SURFACES) {
      const content = readFileSync(surfacePath, 'utf-8')
      expect(content).not.toContain('Foundation Planning')
      expect(content).not.toContain('foundation-planning.md')
    }
  })

  it('T-R12-1.0.2.1: creates both Foundation Planning references with locked bootstrap preconditions', () => {
    const contents = FOUNDATION_PLANNING_PATHS.map((filePath) => {
      expect(existsSync(filePath), `${filePath} should exist`).toBe(true)
      return readFileSync(filePath, 'utf-8')
    })

    expect(contents[0]).toBe(contents[1])

    for (const content of contents) {
      expect(content).toContain('Foundation Planning is a complete workflow')
      expect(content).toContain('alignment-complete')
      expect(content).toContain('empty progress shell')
      expect(content).toContain('<ProjectConventions>')
      expect(content).toContain('<AgentOrchestration>')
      expect(content.toLowerCase()).toContain('tracker')
      expect(content).not.toContain('Phase 1 only establishes')
      expect(content).not.toContain('future workflow')
      expect(content).not.toContain('workflow remains Phase 3 work')
    }
  })

  it('T-R12-1.0.2.2: locks artifact order, review gating, and non-goals', () => {
    for (const filePath of FOUNDATION_PLANNING_PATHS) {
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toContain('PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress')
      expect(content).toContain('one artifact at a time')
      expect(content).toContain('explicit approval')
      expect(content).toContain('no milestone docs')
      expect(content).toContain('no phase docs')
      expect(content).toContain('no test plans')
      expect(content).toContain('no tracker tasks')
    }
  })
})
