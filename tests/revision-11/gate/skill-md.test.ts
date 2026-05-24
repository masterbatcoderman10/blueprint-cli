import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TEMPLATES_DIR = join(__dirname, '../../../templates')
const SKILL_MD_PATH = join(TEMPLATES_DIR, 'skills', 'blueprint', 'SKILL.md')

describe('T-R11-1.0.2 — SKILL.md doc contract', () => {
  it('T-R11-1.0.2.1: has valid frontmatter and all required sections', () => {
    expect(existsSync(SKILL_MD_PATH)).toBe(true)
    const content = readFileSync(SKILL_MD_PATH, 'utf-8')

    // Frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatterMatch).not.toBeNull()
    const frontmatter = frontmatterMatch![1]
    expect(frontmatter).toContain('name: blueprint')
    // description must be present and one-line (no newline within value)
    // description must start with "Use when" for ironclad-invocation phrasing
    const descMatch = frontmatter.match(/description:\s*(.+)/)
    expect(descMatch).not.toBeNull()
    expect(descMatch![1].trim().startsWith('Use when')).toBe(true)
    // description must not contain unescaped newlines (YAML-valid one-liner)
    expect(descMatch![1]).not.toMatch(/\n/)

    // Required sections
    expect(content).toMatch(/##\s+Setup\s+Gate/)
    expect(content).toMatch(/##\s+Shared\s+Laws/)
    expect(content).toMatch(/##\s+Commands/)
    expect(content).toMatch(/##\s+Routing\s+Rules/)
  })

  it('T-R11-1.0.2.2: routing table mirrors ModuleRouting intents 1:1 with renamed reference targets', () => {
    const content = readFileSync(SKILL_MD_PATH, 'utf-8')

    // Every routable intent from the root ModuleRouting table
    const expectedRoutes: Array<[string, string]> = [
      ['Plan a milestone', 'reference/planning.md'],
      ['Plan a phase', 'reference/planning.md'],
      ['Plan tests for a phase', 'reference/plan-test.md'],
      ['Execute tasks', 'reference/execute.md'],
      ['Orchestrate phase', 'reference/orchestrate.md'],
      ['Review gate/stream', 'reference/review.md'],
      ['Address review notes', 'reference/execute.md'],
      ['Phase completion', 'reference/phase-complete.md'],
      ['Bug report or broken functionality', 'reference/bug.md'],
      ['New feature or idea', 'reference/scope-change.md'],
      ['Change existing behavior', 'reference/revision.md'],
      ['SRS discussion/planning', 'reference/srs.md'],
      ['Quick change / tweak', 'reference/tweak.md'],
      ['Commit / git operations', 'reference/commit.md'],
      ['Modify docs structure', 'reference/blueprint-structure.md'],
    ]

    for (const [intent, target] of expectedRoutes) {
      expect(content, `Routing table should contain intent "${intent}" mapping to "${target}"`).toContain(intent)
      expect(content, `Routing table should contain target "${target}" for intent "${intent}"`).toContain(target)
    }

    // "Discuss / clarify" maps to no module
    expect(content).toContain('Discuss / clarify')
    expect(content).toContain('No module needed')
  })

  it('T-R11-1.0.2.3: setup gate requires project-progress, tracker, and blueprint-cli install', () => {
    const content = readFileSync(SKILL_MD_PATH, 'utf-8')

    // Extract setup gate section
    const setupGateMatch = content.match(/##\s+Setup\s+Gate[\s\S]*?(?=##\s)/)
    expect(setupGateMatch).not.toBeNull()
    const setupGate = setupGateMatch![0]

    // Must require populated docs/project-progress.md
    expect(setupGate).toContain('docs/project-progress.md')

    // Must require tracker initialization
    expect(setupGate).toContain('docs/.blueprint/tasks.db')

    // Must instruct agent to install blueprint-cli if tracker missing
    expect(setupGate).toContain('blueprint-cli')
    expect(setupGate.toLowerCase()).toContain('install')
  })
})
