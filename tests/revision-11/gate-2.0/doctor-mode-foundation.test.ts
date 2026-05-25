import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  SKILL_INSTALL_BASES,
  detectProjectMode,
  getSkillCanonicalFiles,
  getSkillRequiredDirectories,
} from '../../../src/doctor/structure'
import {
  resolveAllSkillTemplatePaths,
  resolveTemplatePath,
} from '../../../src/doctor/inventory'

const tempDirs: string[] = []

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-r11-mode-'))
  tempDirs.push(dir)
  return dir
}

async function writeSkillProbe(projectDir: string, skillBase: string): Promise<void> {
  const skillDir = join(projectDir, skillBase)
  await mkdir(skillDir, { recursive: true })
  await writeFile(join(skillDir, 'SKILL.md'), '# Blueprint skill\n', 'utf-8')
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R11-2.0 mode detection foundation', () => {
  it('T-R11-2.0.1.1 detects Claude skill, agents skill, and legacy projects', async () => {
    const claudeProject = await makeProject()
    await writeSkillProbe(claudeProject, '.claude/skills/blueprint')

    const agentsProject = await makeProject()
    await writeSkillProbe(agentsProject, '.agents/skills/blueprint')

    const legacyProject = await makeProject()

    await expect(detectProjectMode(claudeProject)).resolves.toEqual({
      mode: 'skill',
      skillBase: '.claude/skills/blueprint',
    })
    await expect(detectProjectMode(agentsProject)).resolves.toEqual({
      mode: 'skill',
      skillBase: '.agents/skills/blueprint',
    })
    await expect(detectProjectMode(legacyProject)).resolves.toEqual({ mode: 'legacy' })
  })

  it('T-R11-2.0.1.2 gives the Claude install base first-match precedence', async () => {
    const projectDir = await makeProject()
    await writeSkillProbe(projectDir, '.agents/skills/blueprint')
    await writeSkillProbe(projectDir, '.claude/skills/blueprint')

    await expect(detectProjectMode(projectDir)).resolves.toEqual({
      mode: 'skill',
      skillBase: '.claude/skills/blueprint',
    })
  })

  it('T-R11-2.0.1.3 ignores a skill directory when SKILL.md is absent', async () => {
    const projectDir = await makeProject()
    await mkdir(join(projectDir, '.claude/skills/blueprint'), { recursive: true })

    await expect(detectProjectMode(projectDir)).resolves.toEqual({ mode: 'legacy' })
  })

  it('T-R11-2.0.1.4 exports the locked install-base precedence order', () => {
    expect(SKILL_INSTALL_BASES).toEqual([
      '.claude/skills/blueprint',
      '.agents/skills/blueprint',
    ])
  })
})

describe('R11-2.0 skill canonical structure helpers', () => {
  const referenceFiles = [
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

  it('T-R11-2.0.2.1 returns the exact 23 project-relative skill files', () => {
    const skillBase = '.claude/skills/blueprint'
    const expectedFiles = [
      `${skillBase}/SKILL.md`,
      ...referenceFiles.map((fileName) => `${skillBase}/reference/${fileName}`),
      `${skillBase}/scripts/load-context.mjs`,
    ]

    expect(getSkillCanonicalFiles(skillBase)).toEqual(expectedFiles)
    expect(getSkillCanonicalFiles(skillBase)).toHaveLength(23)
    expect(getSkillCanonicalFiles(skillBase).some((path) => path.startsWith('docs/core/'))).toBe(false)
  })

  it.each(SKILL_INSTALL_BASES)(
    'T-R11-2.0.2.2 returns required directories for %s',
    (skillBase) => {
      expect(getSkillRequiredDirectories(skillBase)).toEqual(['docs', 'docs/tweaks', skillBase])
    },
  )
})

describe('R11-2.0 skill template inventory resolution', () => {
  it('T-R11-2.0.3.1 remaps both skill install bases to bundled skill templates', () => {
    const claudeTemplate = resolveTemplatePath('.claude/skills/blueprint/SKILL.md')
    const agentsTemplate = resolveTemplatePath('.agents/skills/blueprint/reference/align.md')

    expect(claudeTemplate).toMatch(/templates\/skills\/blueprint\/SKILL\.md$/)
    expect(agentsTemplate).toMatch(/templates\/skills\/blueprint\/reference\/align\.md$/)
    expect(claudeTemplate).not.toContain('.claude/skills/blueprint')
    expect(agentsTemplate).not.toContain('.agents/skills/blueprint')
  })

  it.each(SKILL_INSTALL_BASES)(
    'T-R11-2.0.3.2 resolves every skill template path for %s',
    async (skillBase) => {
      const entries = resolveAllSkillTemplatePaths(skillBase)

      expect(entries.map((entry) => entry.relativePath)).toEqual(getSkillCanonicalFiles(skillBase))
      expect(entries).toHaveLength(23)
      for (const entry of entries) {
        expect(entry.absolutePath).toContain('templates/skills/blueprint')
        await expect(access(entry.absolutePath)).resolves.toBeUndefined()
      }
    },
  )

  it('T-R11-2.0.3.3 preserves legacy template resolution behavior', () => {
    expect(resolveTemplatePath('docs/core/execution.md')).toMatch(/templates\/docs\/core\/execution\.md$/)
    expect(resolveTemplatePath('CLAUDE.md')).toMatch(/templates\/CLAUDE\.md$/)
    expect(resolveTemplatePath('docs/prd.md')).toMatch(/templates\/prd\.md$/)
  })
})
