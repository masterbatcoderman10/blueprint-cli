import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { alignmentCompleteCommand, migrateCommand } from '../../../src/commands/r11-6-foundation'
import { renderCommandHelp } from '../../../src/help/command'
import { isImplementedCommand } from '../../../src/help/implemented-commands'

const ROOT_DIR = resolve(__dirname, '../../..')
const LEGACY_ROOT_SURFACES = [
  join(ROOT_DIR, 'templates', 'CLAUDE.md'),
  join(ROOT_DIR, 'templates', 'AGENTS.md'),
  join(ROOT_DIR, 'templates', 'GEMINI.md'),
  join(ROOT_DIR, 'templates', 'QWEN.md'),
]

describe('R12-1.C phase boundary contract', () => {
  it('T-R12-1.C.3.1: keeps Phase 1 boundaries locked around legacy surfaces and active command semantics', () => {
    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(false)

    for (const surfacePath of LEGACY_ROOT_SURFACES) {
      const content = readFileSync(surfacePath, 'utf-8')

      expect(content, surfacePath).toContain('<ModuleRouting>')
      expect(content, surfacePath).not.toContain('Foundation Planning')
      expect(content, surfacePath).not.toContain('foundation-planning.md')
    }

    expect(isImplementedCommand('alignment-complete')).toBe(true)
    expect(isImplementedCommand('migrate')).toBe(true)
    expect(isImplementedCommand('foundation-planning')).toBe(false)

    expect(alignmentCompleteCommand.name).toBe('alignment-complete')
    expect(migrateCommand.name).toBe('migrate')

    expect(renderCommandHelp('alignment-complete')).toContain('Usage: blueprint alignment-complete')
    expect(renderCommandHelp('alignment-complete')).toContain(
      'Rewrites alignment-required markers to alignment-complete',
    )
    expect(renderCommandHelp('migrate')).toContain('Usage: blueprint migrate')
    expect(renderCommandHelp('migrate')).toContain('deletes `docs/core/**`')
    expect(renderCommandHelp('foundation-planning')).toBe('')
  })
})
