import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TEMPLATES_DIR = join(__dirname, '../../../templates')
const SKILL_DIR = join(TEMPLATES_DIR, 'skill')

const REQUIRED_INTENTS = [
  'session start',
  'planning',
  'execution',
  'review',
  'tweak',
  'bug',
  'revision',
  'commit',
]

const FORBIDDEN_BLOCKS = ['<SessionStart>', '<HardRules>', '<ModuleRouting>']

const STUB_FILES = [
  { id: 'T-R11-1.C.1', task: 'R11-1.C.1', file: 'CLAUDE.md', platform: 'Claude Code' },
  { id: 'T-R11-1.C.2', task: 'R11-1.C.2', file: 'AGENTS.md', platform: 'AGENTS' },
  { id: 'T-R11-1.C.3', task: 'R11-1.C.3', file: 'GEMINI.md', platform: 'Gemini CLI' },
  { id: 'T-R11-1.C.4', task: 'R11-1.C.4', file: 'QWEN.md', platform: 'Qwen' },
] as const

describe.each(STUB_FILES)('$id — templates/skill/$file doc contract', ({ id, file }) => {
  const filePath = join(SKILL_DIR, file)

  it(`${id}: file exists`, () => {
    expect(existsSync(filePath)).toBe(true)
  })

  it(`${id}: is at most 20 lines`, () => {
    if (!existsSync(filePath)) return
    const content = readFileSync(filePath, 'utf-8')
    const lineCount = content.split('\n').length
    expect(lineCount).toBeLessThanOrEqual(20)
  })

  it(`${id}: references the blueprint skill by name`, () => {
    if (!existsSync(filePath)) return
    const content = readFileSync(filePath, 'utf-8')
    expect(content.toLowerCase()).toContain('blueprint')
  })

  it(`${id}: instructs invocation at session start and on all required intents`, () => {
    if (!existsSync(filePath)) return
    const content = readFileSync(filePath, 'utf-8').toLowerCase()
    for (const intent of REQUIRED_INTENTS) {
      expect(content, `should mention "${intent}"`).toContain(intent)
    }
  })

  it(`${id}: contains no forbidden legacy routing blocks`, () => {
    if (!existsSync(filePath)) return
    const content = readFileSync(filePath, 'utf-8')
    for (const block of FORBIDDEN_BLOCKS) {
      expect(content, `should not contain "${block}"`).not.toContain(block)
    }
  })
})
