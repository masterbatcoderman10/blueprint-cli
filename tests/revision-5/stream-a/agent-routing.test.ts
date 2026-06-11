import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

const TEMPLATE_AGENT_FILES = ['templates/AGENTS.md', 'templates/CLAUDE.md', 'templates/GEMINI.md', 'templates/QWEN.md'] as const
const SKILL_ROUTER_FILES = ['templates/skills/blueprint/SKILL.md', 'skills/blueprint/SKILL.md'] as const

function getAgentPaths(files: readonly string[]): string[] {
  return files.map((relativePath) => resolve(ROOT_DIR, relativePath))
}

describe('T-R5-1.A.1.1: legacy entry points and skill routers contain the orchestration routing contract', () => {
  it.each(getAgentPaths(TEMPLATE_AGENT_FILES))(
    '%s includes the legacy orchestration route',
    async (filePath) => {
      const content = await readFile(filePath, 'utf-8')
      expect(content).toContain('docs/core/orchestrate.md')
      expect(content).toContain('Orchestrate')
    },
  )

  it.each(getAgentPaths(SKILL_ROUTER_FILES))('%s includes the skill orchestration route', async (filePath) => {
    const content = await readFile(filePath, 'utf-8')
    expect(content).toContain('reference/orchestrate.md')
    expect(content).toContain('Orchestrate phase/stream execution')
  })
})
