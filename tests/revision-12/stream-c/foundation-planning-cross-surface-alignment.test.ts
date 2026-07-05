import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { getPackagedSkillPayloadPaths } from '../../../src/release/skill-payload-inventory'

const ROOT_DIR = resolve(__dirname, '../../..')
const TEMPLATE_FOUNDATION_PLANNING_PATH = join(
  ROOT_DIR,
  'templates',
  'skills',
  'blueprint',
  'reference',
  'foundation-planning.md',
)
const REPO_ROOT_FOUNDATION_PLANNING_PATH = join(
  ROOT_DIR,
  'skills',
  'blueprint',
  'reference',
  'foundation-planning.md',
)
const LOCAL_FOUNDATION_PLANNING_PATHS = [
  join(ROOT_DIR, '.claude', 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
  join(ROOT_DIR, '.agents', 'skills', 'blueprint', 'reference', 'foundation-planning.md'),
]
const ACTIVE_DOC_SURFACES = [
  {
    label: 'revision-12 summary',
    path: join(
      ROOT_DIR,
      'docs',
      'milestones',
      'revision-12-alignment-split-and-foundation-planning',
      'revision-12-alignment-split-and-foundation-planning.md',
    ),
    requiredSnippets: [
      'skill-only workflow',
      'one artifact at a time',
      'explicit user approval',
    ],
  },
  {
    label: 'revision-12 phase-1 doc',
    path: join(
      ROOT_DIR,
      'docs',
      'milestones',
      'revision-12-alignment-split-and-foundation-planning',
      'phase-1-bootstrap-surface-and-skill-payload-contract.md',
    ),
    requiredSnippets: [
      'skill-only workflow',
      'PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress',
      'explicit approval',
      'alignment-complete',
    ],
  },
] as const
const LEGACY_ROOT_SURFACES = [
  join(ROOT_DIR, 'templates', 'CLAUDE.md'),
  join(ROOT_DIR, 'templates', 'AGENTS.md'),
  join(ROOT_DIR, 'templates', 'GEMINI.md'),
  join(ROOT_DIR, 'templates', 'QWEN.md'),
]
const STUB_LANGUAGE = [
  'Phase 1 only establishes',
  'future workflow',
  'workflow remains Phase 3 work',
] as const

function read(path: string): string {
  return readFileSync(path, 'utf-8')
}

describe('R12-3.C cross-surface alignment and regression cleanup', () => {
  it('T-R12-3.C.2.1: keeps package and local-skill mirrors anchored to the live template body', () => {
    const template = read(TEMPLATE_FOUNDATION_PLANNING_PATH)

    expect(template).toContain('Foundation Planning is a complete workflow')
    expect(template).toContain('explicit approval')

    for (const snippet of STUB_LANGUAGE) {
      expect(template).not.toContain(snippet)
    }

    expect(read(REPO_ROOT_FOUNDATION_PLANNING_PATH)).toBe(template)

    for (const localPath of LOCAL_FOUNDATION_PLANNING_PATHS) {
      expect(read(localPath)).toBe(template)
    }

    expect(getPackagedSkillPayloadPaths()).toContain(
      'skills/blueprint/reference/foundation-planning.md',
    )
  })

  it('T-R12-3.C.3.1: keeps active docs aligned to the live Foundation Planning workflow contract', () => {
    for (const surface of ACTIVE_DOC_SURFACES) {
      const content = read(surface.path)

      for (const snippet of surface.requiredSnippets) {
        expect(content, `${surface.label} :: ${snippet}`).toContain(snippet)
      }

      for (const snippet of STUB_LANGUAGE) {
        expect(content, `${surface.label} :: ${snippet}`).not.toContain(snippet)
      }
    }
  })

  it('T-R12-3.C.3.2: keeps Foundation Planning off legacy/core surfaces while docs are updated', () => {
    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(
      false,
    )

    for (const surfacePath of LEGACY_ROOT_SURFACES) {
      const content = read(surfacePath)

      expect(content, surfacePath).not.toContain('Foundation Planning')
      expect(content, surfacePath).not.toContain('foundation-planning.md')
    }
  })
})
