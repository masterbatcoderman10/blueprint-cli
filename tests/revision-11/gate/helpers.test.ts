import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'
import { pathExists } from '../../helpers/release'
import {
  createGateProject,
  writeDocsCoreMigrationFixture,
  writeLegacyModeProject,
  writeMarkerState,
  writeManifestFixture,
  writeSkillModeProject,
} from './helpers'

describe('R11-6.0.4 temporary project helpers', () => {
  it('builds a legacy-mode fixture with docs/core and no skill payload roots', async () => {
    const project = await createGateProject()

    try {
      await writeLegacyModeProject(project.rootDir)

      expect(await pathExists(join(project.rootDir, 'docs', 'core', 'alignment.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, '.claude', 'skills', 'blueprint'))).toBe(false)
      expect(await pathExists(join(project.rootDir, MANIFEST_RELATIVE_PATH))).toBe(false)
    } finally {
      await project.cleanup()
    }
  })

  it('builds a skill-mode fixture with both skill roots, root stubs, and a manifest', async () => {
    const project = await createGateProject()

    try {
      await writeSkillModeProject(project.rootDir, { managedFiles: ['CLAUDE.md', 'AGENTS.md'] })

      expect(await pathExists(join(project.rootDir, '.claude', 'skills', 'blueprint', 'SKILL.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, '.agents', 'skills', 'blueprint', 'SKILL.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, 'CLAUDE.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, 'AGENTS.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, MANIFEST_RELATIVE_PATH))).toBe(true)
    } finally {
      await project.cleanup()
    }
  })

  it('writes alignment marker states and the manifest fixture explicitly', async () => {
    const project = await createGateProject()

    try {
      await writeMarkerState(project.rootDir, 'CLAUDE.md', 'required')
      await writeMarkerState(project.rootDir, 'AGENTS.md', 'complete')
      await writeMarkerState(project.rootDir, 'GEMINI.md', 'missing-marker')
      await writeMarkerState(project.rootDir, 'QWEN.md', 'absent')
      await writeManifestFixture(project.rootDir, ['CLAUDE.md'])

      expect(await readFile(join(project.rootDir, 'CLAUDE.md'), 'utf-8')).toContain('alignment-required')
      expect(await readFile(join(project.rootDir, 'AGENTS.md'), 'utf-8')).toContain('alignment-complete')
      expect(await readFile(join(project.rootDir, 'GEMINI.md'), 'utf-8')).not.toContain('alignment-')
      expect(await pathExists(join(project.rootDir, 'QWEN.md'))).toBe(false)
      expect(await pathExists(join(project.rootDir, MANIFEST_RELATIVE_PATH))).toBe(true)
    } finally {
      await project.cleanup()
    }
  })

  it('uses the docs/core migration fixture shape for legacy projects', async () => {
    const project = await createGateProject()

    try {
      await writeDocsCoreMigrationFixture(project.rootDir)

      expect(await pathExists(join(project.rootDir, 'docs', 'core', 'execution.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, 'docs', 'core', 'tracker.md'))).toBe(true)
    } finally {
      await project.cleanup()
    }
  })
})
