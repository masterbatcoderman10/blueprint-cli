import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TEMPLATES_DIR = resolve(__dirname, '../../templates')

const TEMPLATE_FILES = [
  'project-progress.md',
  'prd.md',
  'conventions.md',
  'srs.md',
] as const

const AGENT_TEMPLATE_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'GEMINI.md',
  'QWEN.md',
] as const

describe('T-A.1.1: Editable shell templates exist under templates/', () => {
  it.each(TEMPLATE_FILES)('%s exists in templates/', (filename) => {
    const filePath = resolve(TEMPLATES_DIR, filename)
    expect(existsSync(filePath)).toBe(true)
  })
})

describe('T-A.1.2: Editable shell templates contain {{project-name}} placeholder', () => {
  it.each(TEMPLATE_FILES)('%s contains at least one {{project-name}} token', (filename) => {
    const filePath = resolve(TEMPLATES_DIR, filename)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('{{project-name}}')
  })
})

describe('T-A.3.1: Agent entry-point templates exist for all four agents', () => {
  it.each(AGENT_TEMPLATE_FILES)('%s exists in templates/', (filename) => {
    const filePath = resolve(TEMPLATES_DIR, filename)
    expect(existsSync(filePath)).toBe(true)
  })
})

describe('T-A.3.2: Each agent template references the Blueprint system', () => {
  it.each(AGENT_TEMPLATE_FILES)('%s contains a reference to docs/ or Blueprint protocol', (filename) => {
    const filePath = resolve(TEMPLATES_DIR, filename)
    const content = readFileSync(filePath, 'utf-8')
    expect(content.includes('docs/') || content.includes('Blueprint')).toBe(true)
  })
})
