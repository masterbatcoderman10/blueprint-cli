/**
 * Canonical Blueprint structure rules.
 *
 * Defines which paths Doctor must enforce (canonical core files and the manifest),
 * which root agent files can be managed (and thus subject to drift checks),
 * and which project docs are user-owned and excluded from exact content enforcement.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'

import { MANIFEST_RELATIVE_PATH } from './manifest'

export type ProjectMode = 'skill' | 'legacy'

export interface ProjectModeDetectionResult {
  mode: ProjectMode
  skillBase?: string
}

export const SKILL_INSTALL_BASES: string[] = [
  '.claude/skills/blueprint',
  '.agents/skills/blueprint',
]

const SKILL_REFERENCE_FILES: string[] = [
  'align.md',
  'anti-patterns.md',
  'blueprint-structure.md',
  'bug.md',
  'commit-review.md',
  'commit.md',
  'execute.md',
  'hierarchy.md',
  'orchestrate.md',
  'phase-complete.md',
  'plan-milestone.md',
  'plan-phase.md',
  'plan-prd.md',
  'plan-test.md',
  'planning.md',
  'review.md',
  'revision.md',
  'scope-change.md',
  'srs.md',
  'tracker.md',
  'tweak.md',
]

export const CANONICAL_CORE_FILES: string[] = [
  'docs/core/alignment.md',
  'docs/core/blueprint-structure.md',
  'docs/core/bug-resolution.md',
  'docs/core/execution.md',
  'docs/core/git-execution-workflow.md',
  'docs/core/git-review-workflow.md',
  'docs/core/hierarchy.md',
  'docs/core/milestone-planning.md',
  'docs/core/orchestrate.md',
  'docs/core/phase-completion.md',
  'docs/core/phase-planning.md',
  'docs/core/planning.md',
  'docs/core/prd-planning.md',
  'docs/core/review.md',
  'docs/core/revision-planning.md',
  'docs/core/scope-change.md',
  'docs/core/srs-planning.md',
  'docs/core/test-planning.md',
  'docs/core/tracker.md',
  'docs/core/tweak-planning.md',
]

export const REQUIRED_BLUEPRINT_DIRECTORIES: string[] = ['docs', 'docs/core', 'docs/tweaks']

/**
 * User-owned editable project docs. These are scaffolded as shells but
 * thereafter belong to the project. Doctor never flags them for drift.
 */
export const REQUIRED_CANONICAL_FILES: string[] = [
  'docs/tweaks/README.md',
]

export const EDITABLE_PROJECT_DOCS: string[] = [
  'docs/prd.md',
  'docs/project-progress.md',
  'docs/conventions.md',
  'docs/srs.md',
]

/**
 * Root agent files that Blueprint can manage. Only files listed in the
 * project manifest's managedFiles are subject to drift checks.
 */
export const SUPPORTED_AGENT_FILES: string[] = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']

/**
 * Returns the full set of canonical paths Doctor must enforce for every
 * Blueprint project: all docs/core/** files plus the manifest path.
 * Managed root agent files are project-specific and determined separately
 * via getManagedAgentPaths().
 */
export function getCanonicalStructurePaths(): string[] {
  return [...CANONICAL_CORE_FILES, MANIFEST_RELATIVE_PATH]
}

/**
 * Filters a manifest's managedFiles list down to recognised agent file names.
 * Unrecognised entries are ignored.
 */
export function getManagedAgentPaths(managedFiles: string[]): string[] {
  return managedFiles.filter((f) => SUPPORTED_AGENT_FILES.includes(f))
}

/**
 * Returns true if the given project-relative path is a user-owned editable
 * document that Doctor must never flag for exact content drift.
 */
export function isEditableProjectDoc(relativePath: string): boolean {
  return EDITABLE_PROJECT_DOCS.includes(relativePath)
}

export function getSkillCanonicalFiles(skillBase: string): string[] {
  return [
    `${skillBase}/SKILL.md`,
    ...SKILL_REFERENCE_FILES.map((fileName) => `${skillBase}/reference/${fileName}`),
    `${skillBase}/scripts/load-context.mjs`,
  ]
}

export function getSkillRequiredDirectories(skillBase: string): string[] {
  return ['docs', 'docs/tweaks', skillBase]
}

export async function detectProjectMode(projectDir: string): Promise<ProjectModeDetectionResult> {
  for (const skillBase of SKILL_INSTALL_BASES) {
    try {
      await access(join(projectDir, skillBase, 'SKILL.md'))
      return { mode: 'skill', skillBase }
    } catch (error) {
      const nodeError = error as { code?: string }
      if (nodeError.code !== 'ENOENT') {
        throw error
      }
    }
  }

  return { mode: 'legacy' }
}
