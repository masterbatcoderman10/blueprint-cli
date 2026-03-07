import { describe, it, expect } from 'vitest'

import {
  CANONICAL_CORE_FILES,
  EDITABLE_PROJECT_DOCS,
  SUPPORTED_AGENT_FILES,
  getCanonicalStructurePaths,
  getManagedAgentPaths,
  isEditableProjectDoc,
} from '../../../src/doctor/structure'
import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'

describe('T-3.0.2.1: canonical structure inventory completeness', () => {
  it('includes docs/.blueprint/manifest.json in canonical paths', () => {
    const paths = getCanonicalStructurePaths()
    expect(paths).toContain(MANIFEST_RELATIVE_PATH)
    expect(paths).toContain('docs/.blueprint/manifest.json')
  })

  it('includes all 17 required docs/core/** files', () => {
    const paths = getCanonicalStructurePaths()
    const expectedCoreFiles = [
      'docs/core/alignment.md',
      'docs/core/blueprint-structure.md',
      'docs/core/bug-resolution.md',
      'docs/core/execution.md',
      'docs/core/git-execution-workflow.md',
      'docs/core/git-review-workflow.md',
      'docs/core/health-check.md',
      'docs/core/hierarchy.md',
      'docs/core/milestone-planning.md',
      'docs/core/phase-completion.md',
      'docs/core/phase-planning.md',
      'docs/core/planning.md',
      'docs/core/prd-planning.md',
      'docs/core/review.md',
      'docs/core/revision-planning.md',
      'docs/core/scope-change.md',
      'docs/core/test-planning.md',
    ]
    for (const file of expectedCoreFiles) {
      expect(paths).toContain(file)
    }
    expect(CANONICAL_CORE_FILES).toHaveLength(17)
  })

  it('returns managed agent paths for files in manifest selection', () => {
    const managedPaths = getManagedAgentPaths(['CLAUDE.md', 'AGENTS.md'])
    expect(managedPaths).toContain('CLAUDE.md')
    expect(managedPaths).toContain('AGENTS.md')
  })

  it('filters out non-agent-file entries from managedFiles list', () => {
    const managedPaths = getManagedAgentPaths(['CLAUDE.md', 'unknown-file.md'])
    expect(managedPaths).toContain('CLAUDE.md')
    expect(managedPaths).not.toContain('unknown-file.md')
  })

  it('supports all four agent file types', () => {
    expect(SUPPORTED_AGENT_FILES).toContain('CLAUDE.md')
    expect(SUPPORTED_AGENT_FILES).toContain('AGENTS.md')
    expect(SUPPORTED_AGENT_FILES).toContain('GEMINI.md')
    expect(SUPPORTED_AGENT_FILES).toContain('QWEN.md')
  })
})

describe('T-3.0.2.2: editable project docs are excluded from exact content enforcement', () => {
  it('marks docs/prd.md as a user-owned editable doc', () => {
    expect(isEditableProjectDoc('docs/prd.md')).toBe(true)
  })

  it('marks docs/project-progress.md as a user-owned editable doc', () => {
    expect(isEditableProjectDoc('docs/project-progress.md')).toBe(true)
  })

  it('marks docs/conventions.md as a user-owned editable doc', () => {
    expect(isEditableProjectDoc('docs/conventions.md')).toBe(true)
  })

  it('does not mark docs/core files as editable', () => {
    expect(isEditableProjectDoc('docs/core/execution.md')).toBe(false)
    expect(isEditableProjectDoc('docs/core/health-check.md')).toBe(false)
  })

  it('does not mark root agent files as editable', () => {
    expect(isEditableProjectDoc('CLAUDE.md')).toBe(false)
    expect(isEditableProjectDoc('AGENTS.md')).toBe(false)
  })

  it('EDITABLE_PROJECT_DOCS contains exactly the three user-owned docs', () => {
    expect(EDITABLE_PROJECT_DOCS).toContain('docs/prd.md')
    expect(EDITABLE_PROJECT_DOCS).toContain('docs/project-progress.md')
    expect(EDITABLE_PROJECT_DOCS).toContain('docs/conventions.md')
    expect(EDITABLE_PROJECT_DOCS).toHaveLength(3)
  })
})
