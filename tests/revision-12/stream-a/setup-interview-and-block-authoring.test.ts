import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const LEGACY_ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const SKILL_TEMPLATE_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'align.md')

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

describe('R12-2.A setup interview and block authoring contract', () => {
  it('T-R12-2.A.1.1: covers setup-only questioning topics in small chunks before any write', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toMatch(/project conventions/i)
      expect(content).toMatch(/tech stack/i)
      expect(content).toMatch(/testing/i)
      expect(content).toMatch(/file layout/i)
      expect(content).toMatch(/coding standards/i)
      expect(content).toMatch(/anti-patterns/i)
      expect(content).toMatch(/release notes/i)
      expect(content).toMatch(/project-specific constraints/i)
      expect(content).toContain('small chunks')
      expect(content).toContain('explicit confirmation before writing')
    }
  })

  it('T-R12-2.A.1.2: explicitly forbids setup questioning from drifting into downstream planning artifacts', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain(
        'Do NOT ask setup questions that try to draft PRDs, SRS docs, milestone docs, phase docs, test plans, tracker tasks, or board activity.',
      )
    }
  })

  it('T-R12-2.A.2.1: requires locked AgentOrchestration headings plus defaults and user confirmation', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('## Harness Capabilities')
      expect(content).toContain('## Role Defaults')
      expect(content).toContain('## Failure Escalation')
      expect(content).toContain('## Skills and MCPs')
      expect(content).toContain('## Notes')
      expect(content).toContain('Provide defaults for each section and confirm them with the user before writing.')
      expect(content).toContain('Planning does not require subagent model defaults.')
    }
  })

  it('T-R12-2.A.2.2: records only user-named skills and MCPs during Alignment', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('Record only the skills and MCPs the user explicitly names.')
      expect(content).toContain('Do NOT scan installed skills or MCPs during Alignment.')
    }
  })

  it('T-R12-2.A.3.1: scans supported root entry-point files and preserves the split-block identity rules', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('CLAUDE.md')
      expect(content).toContain('AGENTS.md')
      expect(content).toContain('GEMINI.md')
      expect(content).toContain('QWEN.md')
      expect(content).toContain('Respect absent supported files.')
      expect(content).toContain('Write every existing supported file.')
      expect(content).toContain('<ProjectConventions> must remain byte-identical across those files.')
      expect(content).toContain('<AgentOrchestration> may differ by harness or file.')
    }
  })

  it('T-R12-2.A.4.1: sequences the final handoff as approved edits, alignment-complete, fresh-session guidance, then stop', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      const approvedEditsIndex = content.indexOf('After the approved setup block edits are written')
      const completionIndex = content.indexOf('run `blueprint alignment-complete`')
      const freshSessionIndex = content.indexOf('start a fresh session or clear context before Foundation Planning')
      const stopIndex = content.indexOf('Alignment stops after this handoff.')

      expect(approvedEditsIndex).toBeGreaterThan(-1)
      expect(completionIndex).toBeGreaterThan(approvedEditsIndex)
      expect(freshSessionIndex).toBeGreaterThan(completionIndex)
      expect(stopIndex).toBeGreaterThan(freshSessionIndex)
    }
  })

  it('T-R12-2.A.4.2: keeps legacy Alignment from growing a Foundation Planning route or downstream planning side effects', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('Legacy mode does not gain a Foundation Planning route.')
      expect(content).toContain(
        'Do NOT create milestone docs, phase docs, test plans, tracker tasks, or board activity during Alignment.',
      )
    }
  })
})
