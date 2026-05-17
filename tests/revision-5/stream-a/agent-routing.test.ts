import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')

const LIVE_AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'QWEN.md'] as const
const TEMPLATE_AGENT_FILES = ['templates/AGENTS.md', 'templates/CLAUDE.md', 'templates/GEMINI.md', 'templates/QWEN.md'] as const

function getAgentPaths(files: readonly string[]): string[] {
  return files.map((relativePath) => resolve(ROOT_DIR, relativePath))
}

describe('T-R5-1.A.1.1: live and template agent entry points contain the orchestration routing row', () => {
  it.each([...getAgentPaths(LIVE_AGENT_FILES), ...getAgentPaths(TEMPLATE_AGENT_FILES)])(
    '%s includes the orchestration route',
    async (filePath) => {
      const content = await readFile(filePath, 'utf-8')
      expect(content).toContain('docs/core/orchestrate.md')
      expect(content).toContain('Orchestrate')
    },
  )
})
