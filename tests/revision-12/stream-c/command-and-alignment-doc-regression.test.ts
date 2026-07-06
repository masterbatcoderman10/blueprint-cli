import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')

const COMMAND_COPY_PATHS = [
  'README.md',
  'docs/release-contract.md',
  'docs/releasing.md',
  'src/help/command.ts',
] as const

const ALIGNMENT_COPY_PATHS = [
  'docs/core/alignment.md',
  'templates/docs/core/alignment.md',
  'templates/skills/blueprint/reference/align.md',
  'skills/blueprint/reference/align.md',
  '.agents/skills/blueprint/reference/align.md',
  '.claude/skills/blueprint/reference/align.md',
] as const

const STALE_COMMAND_PHRASES = [
  'preserve an existing alignment marker state',
  'preserves existing alignment marker state',
  'Any stricter `migrate` command behavior belongs to Phase 4 and stays out of scope during Alignment.',
  'coming in Revision 11 Phase 6',
  'deferred to Revision 11 Phase 6',
] as const

function read(relativePath: string): string {
  return readFileSync(join(ROOT_DIR, relativePath), 'utf-8')
}

describe('R12-4.C active-doc regression guards', () => {
  it('T-R12-4.C.3.1: active command-copy surfaces keep the current no-partial-flip and forced-realignment contract', () => {
    const readme = read('README.md')
    const releaseContract = read('docs/release-contract.md')
    const releaseGuide = read('docs/releasing.md')
    const commandHelp = read('src/help/command.ts')

    expect(readme).toContain('forces fresh Alignment, never preserves alignment-complete')
    expect(releaseContract).toContain('fails without partial marker flips')
    expect(releaseGuide).toContain('fails without partial marker flips')
    expect(commandHelp).toContain('fails without partial marker flips')
    expect(commandHelp).toContain('never preserves alignment-complete')

    for (const content of [readme, releaseContract, releaseGuide, commandHelp]) {
      for (const phrase of STALE_COMMAND_PHRASES) {
        expect(content).not.toContain(phrase)
      }

      expect(content).not.toContain('smart merge')
    }
  })

  it('T-R12-4.C.3.2: every active Alignment surface treats migrate behavior as current and keeps smart merge disallowed', () => {
    for (const relativePath of ALIGNMENT_COPY_PATHS) {
      const content = read(relativePath)

      expect(content).toContain('Do NOT let `migrate` perform smart merge work.')
      expect(content).toContain('`blueprint migrate` already forces fresh Alignment and never preserves `alignment-complete`.')
      expect(content).toContain('Old-guidance preservation stays with Alignment, with explicit user approval.')
      expect(content).not.toContain('Any stricter `migrate` command behavior belongs to Phase 4 and stays out of scope during Alignment.')
    }
  })
})
