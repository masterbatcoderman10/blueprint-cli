import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../../')

const README_PATH = join(ROOT_DIR, 'README.md')
const RELEASE_GUIDE_PATH = join(ROOT_DIR, 'docs', 'releasing.md')
const ARCHIVAL_PHASE_DOC_PATH = join(
  ROOT_DIR,
  'docs',
  'milestones',
  'revision-11-skill-based-agent-surface',
  'revision-11-skill-based-agent-surface.md',
)

const TEMPLATE_AGENT_PATHS = [
  'templates/AGENTS.md',
  'templates/CLAUDE.md',
  'templates/GEMINI.md',
  'templates/QWEN.md',
] as const

const ALIGNMENT_DOC_PATHS = [
  'docs/core/alignment.md',
  'templates/docs/core/alignment.md',
  'templates/skills/blueprint/reference/align.md',
  'skills/blueprint/reference/align.md',
  '.agents/skills/blueprint/reference/align.md',
] as const

function readDoc(relativePath: string): string {
  return readFileSync(join(ROOT_DIR, relativePath), 'utf-8')
}

describe('R11-6.C active command doc contract', () => {
  it('describes alignment-complete and migrate as available on active surfaces without Phase 6 deferral language', () => {
    const readme = readDoc('README.md')
    const releaseGuide = readDoc('docs/releasing.md')
    const migrateHelp = readDoc('src/help/command.ts')
    const templateAgents = TEMPLATE_AGENT_PATHS.map(readDoc)
    const alignmentDocs = ALIGNMENT_DOC_PATHS.map(readDoc)

    expect(readme).toContain('blueprint alignment-complete')
    expect(readme).toContain('blueprint migrate')
    expect(readme).toContain('Runtime help currently guides users through `init`, `doctor`, `alignment-complete`, and `migrate`')
    expect(readme).toContain('deletes `docs/core/**`')
    expect(readme).not.toContain('Revision 11 Phase 6')

    expect(releaseGuide).toContain('blueprint migrate')
    expect(releaseGuide).toContain('deletes `docs/core/**`')
    expect(releaseGuide).not.toContain('Revision 11 Phase 6')

    expect(migrateHelp).toContain('Usage: blueprint migrate')
    expect(migrateHelp).toContain('deletes `docs/core/**`')
    expect(migrateHelp).not.toContain('Revision 11 Phase 6')

    for (const content of templateAgents) {
      expect(content).toContain('blueprint migrate')
      expect(content).toContain('convert the project in place')
      expect(content).not.toContain('coming in Revision 11 Phase 6')
    }

    for (const content of alignmentDocs) {
      expect(content).toContain('alignment-complete')
      expect(content).toContain('already-complete, missing-marker, and absent-file cases')
      expect(content).not.toContain('deferred to Revision 11 Phase 6')
    }
  })

  it('keeps the alignment guidance mirrored across the source, template, and skill payload copies', () => {
    const sourceAlignment = readDoc('docs/core/alignment.md')
    const templateAlignment = readDoc('templates/docs/core/alignment.md')
    const skillAlignmentBodies = ALIGNMENT_DOC_PATHS.slice(2).map((path) => readDoc(path))

    expect(templateAlignment).toBe(sourceAlignment)

    const [expectedSkillAlignment, ...restSkillAlignments] = skillAlignmentBodies
    for (const body of restSkillAlignments) {
      expect(body).toBe(expectedSkillAlignment)
    }
  })

  it('allows archival milestone history to retain the Phase 6 planning language', () => {
    const archival = readFileSync(ARCHIVAL_PHASE_DOC_PATH, 'utf-8')

    expect(archival).toContain('Phase 6')
    expect(archival).toContain('deferred')
  })
})
