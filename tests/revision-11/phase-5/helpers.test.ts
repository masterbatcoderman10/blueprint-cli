import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SKILL_PAYLOAD_INVENTORY } from '../../../src/release/skill-payload-inventory'
import {
  ACTIVE_CROSS_REFERENCE_STATIC_FILES,
  ROOT_ENTRY_POINT_FILES,
  getActiveCrossReferenceFiles,
  getLocalSkillPayloadInventory,
  getRootEntryPointTemplatePairs,
} from './helpers'

describe('R11-5.0.2 Phase 5 shared helpers', () => {
  it('T-R11-5.0.2.1 enumerates root entry points with deterministic skill-template pairings', () => {
    const root = resolve(process.cwd())

    expect(ROOT_ENTRY_POINT_FILES).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'])
    expect(getRootEntryPointTemplatePairs()).toEqual(
      ROOT_ENTRY_POINT_FILES.map((fileName) => ({
        fileName,
        rootPath: resolve(root, fileName),
        templatePath: resolve(root, 'templates/skill', fileName),
      })),
    )
  })

  it('T-R11-5.0.2.2 derives the local .claude install payload from the shared skill inventory', () => {
    const root = resolve(process.cwd())
    const localInventory = getLocalSkillPayloadInventory()

    expect(localInventory).toHaveLength(23)
    expect(localInventory.map((entry) => entry.templatePath)).toEqual(
      SKILL_PAYLOAD_INVENTORY.map((entry) => resolve(root, entry.templatePath)),
    )
    expect(localInventory.map((entry) => entry.localInstallPath)).toEqual(
      SKILL_PAYLOAD_INVENTORY.map((entry) =>
        resolve(root, '.claude/skills/blueprint', entry.templatePath.replace('templates/skills/blueprint/', '')),
      ),
    )
  })

  it('T-R11-5.0.2.3 separates active cross-reference surfaces from archival milestone history', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'blueprint-phase-5-surfaces-'))

    await Promise.all([
      mkdir(join(fixtureRoot, 'docs/core'), { recursive: true }),
      mkdir(join(fixtureRoot, 'docs/milestones/revision-11'), { recursive: true }),
      mkdir(join(fixtureRoot, 'templates/docs/core'), { recursive: true }),
      mkdir(join(fixtureRoot, 'templates/skill'), { recursive: true }),
      mkdir(join(fixtureRoot, 'templates/skills/blueprint/reference'), { recursive: true }),
      mkdir(join(fixtureRoot, 'skills/blueprint/reference'), { recursive: true }),
      mkdir(join(fixtureRoot, '.claude/skills/blueprint/reference'), { recursive: true }),
    ])

    await Promise.all([
      writeFile(join(fixtureRoot, 'CLAUDE.md'), '# root\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'README.md'), '# readme\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'docs/core/execute.md'), '# active\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'docs/project-progress.md'), '# progress\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'docs/release-contract.md'), '# release contract\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'docs/releasing.md'), '# releasing\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'docs/milestones/revision-11/phase-history.md'), '# archival\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'templates/docs/core/execute.md'), '# template\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'templates/skill/CLAUDE.md'), '# template\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'templates/skills/blueprint/reference/execute.md'), '# skill template\n', 'utf-8'),
      writeFile(join(fixtureRoot, 'skills/blueprint/reference/execute.md'), '# repo skill\n', 'utf-8'),
      writeFile(join(fixtureRoot, '.claude/skills/blueprint/reference/execute.md'), '# local skill\n', 'utf-8'),
    ])

    const activeFiles = await getActiveCrossReferenceFiles(fixtureRoot)

    expect(ACTIVE_CROSS_REFERENCE_STATIC_FILES).toContain('README.md')
    expect(ACTIVE_CROSS_REFERENCE_STATIC_FILES).toContain('docs/release-contract.md')
    expect(ACTIVE_CROSS_REFERENCE_STATIC_FILES).toContain('docs/releasing.md')
    expect(activeFiles).toEqual([
      '.claude/skills/blueprint/reference/execute.md',
      'CLAUDE.md',
      'README.md',
      'docs/core/execute.md',
      'docs/project-progress.md',
      'docs/release-contract.md',
      'docs/releasing.md',
      'skills/blueprint/reference/execute.md',
      'templates/docs/core/execute.md',
      'templates/skill/CLAUDE.md',
      'templates/skills/blueprint/reference/execute.md',
    ])
    expect(activeFiles).not.toContain('docs/milestones/revision-11/phase-history.md')
  })
})
