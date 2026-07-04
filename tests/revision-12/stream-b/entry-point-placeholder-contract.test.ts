import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT_DIR = resolve(__dirname, '../../..')
const SKILL_TEMPLATE_DIR = join(ROOT_DIR, 'templates', 'skill')
const ROOT_ENTRY_POINT_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

const SKILL_TEMPLATE_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const
const LEGACY_TEMPLATE_FILES = ['templates/CLAUDE.md', 'templates/AGENTS.md', 'templates/GEMINI.md', 'templates/QWEN.md'] as const

const REQUIRED_INTRO = `This project uses the Blueprint development system.

Invoke the \`blueprint\` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.
`

const MARKER = '<!-- blueprint-status: alignment-required -->'
const GENERIC_PLACEHOLDER_FORBIDDEN_DETAILS = [
  'Node.js >=18.0.0',
  'blueprint-agentic-development',
  'npm run release:check',
  '/ponytail',
  'gpt-5.4 xhigh',
  'gpt-5.5 xhigh',
]

describe('R12-1.B.1 placeholder template contract', () => {
  it('T-R12-1.B.1.1: skill-mode templates are byte-identical placeholders with both setup blocks and trailing marker', () => {
    const contents = SKILL_TEMPLATE_FILES.map((fileName) => readFileSync(join(SKILL_TEMPLATE_DIR, fileName), 'utf-8'))
    const [expected, ...rest] = contents

    expect(expected.startsWith(REQUIRED_INTRO)).toBe(true)
    expect(expected).toContain('<ProjectConventions>')
    expect(expected).toContain('</ProjectConventions>')
    expect(expected).toContain('<AgentOrchestration>')
    expect(expected).toContain('</AgentOrchestration>')
    expect(expected.indexOf('<ProjectConventions>')).toBeGreaterThan(expected.indexOf(REQUIRED_INTRO.trimEnd()))
    expect(expected.indexOf('<AgentOrchestration>')).toBeGreaterThan(expected.indexOf('</ProjectConventions>'))
    expect(expected.trimEnd().endsWith(MARKER)).toBe(true)

    for (const content of rest) {
      expect(content).toBe(expected)
    }
  })

  it('T-R12-1.B.1.2: skill-mode placeholders stay generic and legacy templates stay placeholder-free', () => {
    const placeholder = readFileSync(join(SKILL_TEMPLATE_DIR, 'CLAUDE.md'), 'utf-8')

    for (const detail of GENERIC_PLACEHOLDER_FORBIDDEN_DETAILS) {
      expect(placeholder).not.toContain(detail)
    }

    for (const relativePath of LEGACY_TEMPLATE_FILES) {
      const content = readFileSync(join(ROOT_DIR, relativePath), 'utf-8')
      expect(content, relativePath).not.toContain('<ProjectConventions>')
      expect(content, relativePath).not.toContain('<AgentOrchestration>')
      expect(content, relativePath).not.toContain(MARKER)
    }
  })
})

describe('R12-1.B.2 live root split-block contract', () => {
  it('T-R12-1.B.2.1: live root entry points expose real current ProjectConventions and AgentOrchestration blocks', () => {
    for (const fileName of ROOT_ENTRY_POINT_FILES) {
      const content = readFileSync(join(ROOT_DIR, fileName), 'utf-8')

      expect(content, fileName).toContain('<ProjectConventions>')
      expect(content, fileName).toContain('</ProjectConventions>')
      expect(content, fileName).toContain('Node.js >=18.0.0')
      expect(content, fileName).toContain('blueprint-agentic-development')
      expect(content, fileName).toContain('<AgentOrchestration>')
      expect(content, fileName).toContain('</AgentOrchestration>')
      expect(content, fileName).toContain('/ponytail')
      expect(content, fileName).toContain('gpt-5.4 xhigh')
      expect(content, fileName).toContain('gpt-5.5 xhigh')
    }
  })

  it('T-R12-1.B.2.2: live root entry points stay markerless for populated-project backcompat', () => {
    for (const fileName of ROOT_ENTRY_POINT_FILES) {
      const content = readFileSync(join(ROOT_DIR, fileName), 'utf-8')

      expect(content, fileName).not.toContain('alignment-required')
      expect(content, fileName).not.toContain('alignment-complete')
    }
  })
})
