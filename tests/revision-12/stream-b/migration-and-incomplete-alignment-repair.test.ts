import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const LEGACY_ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const SKILL_TEMPLATE_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'align.md')

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

describe('R12-2.B migration and incomplete-alignment repair contract', () => {
  it('T-R12-2.B.1.1: fast-tracks only migrated populated projects into supported-root setup repair', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('populated progress plus `alignment-required` plus `blueprint-origin: legacy-migration`')
      expect(content).toContain('fast-track')
      expect(content).toContain('post-migration fast-track repair path')
      expect(content).toContain('supported root entry-point setup repair')
      expect(content).toContain('Skip product discovery, codebase discovery, and git discovery')
    }
  })

  it('T-R12-2.B.2.1: requires Alignment to own migrated-guidance preservation with explicit approval', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('Read old/root guidance where available.')
      expect(content).toContain('Present what can be preserved in the repaired setup blocks.')
      expect(content).toContain('Ask for approval before preserving, correcting, or dropping any migrated guidance.')
      expect(content).toContain('Alignment owns preservation and correction of old guidance.')
      expect(content).toContain('write only the confirmed')
    }
  })

  it('T-R12-2.B.2.2: keeps migrate mechanical and defers smart-merge behavior to Phase 4', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('Do NOT let `migrate` perform smart merge work.')
      expect(content).toContain('Any stricter `migrate` command behavior stays deferred to Phase 4.')
    }
  })

  it('T-R12-2.B.3.1: treats populated projects without legacy origin as an incomplete-alignment stop-state', () => {
    for (const content of [read(LEGACY_ALIGNMENT_PATH), read(SKILL_TEMPLATE_ALIGNMENT_PATH)]) {
      expect(content).toContain('populated progress plus `alignment-required` without `blueprint-origin: legacy-migration`')
      expect(content).toContain('Treat this as an inconsistent state.')
      expect(content).toContain('Block normal workflows.')
      expect(content).toContain('Alignment must be rerun or repaired before normal routing resumes.')
      expect(content).toContain('This is a stop-state, not a normal routing case.')
    }
  })
})
