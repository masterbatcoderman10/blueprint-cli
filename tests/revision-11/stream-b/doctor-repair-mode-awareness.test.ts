import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createDriftedFileFinding, createMissingStructureFinding } from '../../../src/doctor/findings'
import { resolveTemplatePath } from '../../../src/doctor/inventory'
import { createRepairPlan } from '../../../src/doctor/repair'
import { SKILL_INSTALL_BASES } from '../../../src/doctor/structure'

describe('T-R11-2.B.1: repair mode awareness', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true })
    }
  })

  async function makeProjectDir(): Promise<string> {
    const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r11-2-b-'))
    tempDirs.push(projectDir)
    return projectDir
  }

  it.each(SKILL_INSTALL_BASES)(
    'T-R11-2.B.1.1 creates missing skill files from the bundled skill template for %s',
    async (skillBase) => {
      const projectDir = await makeProjectDir()
      const targetPath = `${skillBase}/reference/align.md`

      const plan = await createRepairPlan(
        [createMissingStructureFinding(targetPath, 'file')],
        projectDir,
        'skill',
        skillBase,
      )

      expect(plan.hasBlockingFindings).toBe(false)
      expect(plan.actions).toEqual([
        {
          type: 'create-from-template',
          targetPath,
          templatePath: resolveTemplatePath(targetPath),
          description: `Create missing file from template: ${targetPath}`,
        },
      ])
      expect(plan.actions[0]).toMatchObject({
        templatePath: expect.stringContaining('templates/skills/blueprint/reference/align.md'),
      })
    },
  )

  it('T-R11-2.B.1.2 reports drifted skill canonical files without replacing them', async () => {
    const projectDir = await makeProjectDir()
    const skillBase = '.claude/skills/blueprint'
    const driftedSkillFile = `${skillBase}/reference/align.md`

    const plan = await createRepairPlan(
      [
        createDriftedFileFinding(driftedSkillFile),
        createDriftedFileFinding('AGENTS.md'),
      ],
      projectDir,
      'skill',
      skillBase,
    )

    expect(plan.actions).toEqual([
      {
        type: 'replace-in-place',
        targetPath: 'AGENTS.md',
        templatePath: resolveTemplatePath('AGENTS.md'),
        description: 'Replace drifted managed agent file with bundled template: AGENTS.md',
      },
    ])
  })

  it('T-R11-2.B.1.3 preserves legacy repair planning behavior', async () => {
    const projectDir = await makeProjectDir()

    const plan = await createRepairPlan(
      [
        createMissingStructureFinding('docs/core/alignment.md', 'file'),
        createDriftedFileFinding('docs/core/execution.md'),
        createDriftedFileFinding('CLAUDE.md'),
      ],
      projectDir,
      'legacy',
    )

    expect(plan.actions).toEqual([
      {
        type: 'create-from-template',
        targetPath: 'docs/core/alignment.md',
        templatePath: resolveTemplatePath('docs/core/alignment.md'),
        description: 'Create missing file from template: docs/core/alignment.md',
      },
      {
        type: 'replace-in-place',
        targetPath: 'CLAUDE.md',
        templatePath: resolveTemplatePath('CLAUDE.md'),
        description: 'Replace drifted managed agent file with bundled template: CLAUDE.md',
      },
    ])
  })
})
