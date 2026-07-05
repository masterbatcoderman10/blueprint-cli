import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { renderCommandHelp } from '../../../src/help/command'
import { isImplementedCommand } from '../../../src/help/implemented-commands'

const ROOT_DIR = resolve(__dirname, '../../..')
const ALIGNMENT_SURFACES = [
  join(ROOT_DIR, 'docs', 'core', 'alignment.md'),
  join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md'),
  join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'align.md'),
  join(ROOT_DIR, 'skills', 'blueprint', 'reference', 'align.md'),
]

const FORBIDDEN_LEGACY_SNIPPETS = [
  'docs/prd.md — Stage 1 (body only)',
  'docs/core/foundation-planning.md',
  'templates/docs/core/foundation-planning.md',
  'First milestone document',
  'blueprint board',
  'POST /tasks',
]

describe('R12-2.C phase boundary contract', () => {
  it('T-R12-2.C.3.1: keeps Phase 2 boundaries locked around setup-only alignment surfaces and away from downstream planning/tracker work', () => {
    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(false)

    for (const surfacePath of ALIGNMENT_SURFACES) {
      const content = readFileSync(surfacePath, 'utf-8')

      expect(content, surfacePath).toMatch(
        /It does NOT produce PRDs, SRS docs, milestone docs, phase docs,\s+test plans, tracker tasks, board mutations, or docs\/project-progress\.md\./,
      )
      expect(content, surfacePath).toContain(
        'Do NOT create milestone docs, phase docs, test plans, tracker tasks, or board mutations during Alignment.',
      )
      expect(content, surfacePath).toContain('Do NOT continue into Foundation Planning from Alignment.')

      for (const snippet of FORBIDDEN_LEGACY_SNIPPETS) {
        expect(content, `${surfacePath} :: ${snippet}`).not.toContain(snippet)
      }
    }

    expect(isImplementedCommand('foundation-planning')).toBe(false)
    expect(renderCommandHelp('foundation-planning')).toBe('')
  })
})
