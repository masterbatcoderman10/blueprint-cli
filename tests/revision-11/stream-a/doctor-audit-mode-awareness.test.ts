import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { resolveAllSkillTemplatePaths } from '../../../src/doctor/inventory'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'
import { SKILL_INSTALL_BASES } from '../../../src/doctor/structure'
import { openDb } from '../../../src/tracker/db'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-r11-audit-mode-'))
  tempDirs.push(dir)
  return dir
}

async function writeManifest(projectDir: string): Promise<void> {
  const manifestPath = join(projectDir, MANIFEST_RELATIVE_PATH)
  await mkdir(dirname(manifestPath), { recursive: true })
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        templateVersion: TEMPLATE_VERSION,
        cliVersion: '0.1.0',
        managedFiles: [],
      },
      null,
      2,
    ),
    'utf-8',
  )
}

function writeTracker(projectDir: string): void {
  const handle = openDb(projectDir)
  const now = Date.now()
  handle.db
    .prepare('INSERT OR REPLACE INTO project_meta (id, name, tagline, created_at, updated_at) VALUES (1, ?, ?, ?, ?)')
    .run('test-project', 'Test project', now, now)
  handle.db.close()
}

async function writeSkillCanonicalProject(projectDir: string, skillBase: string): Promise<void> {
  await mkdir(join(projectDir, 'docs/tweaks'), { recursive: true })

  for (const { relativePath, absolutePath } of resolveAllSkillTemplatePaths(skillBase)) {
    const destination = join(projectDir, relativePath)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, await readFile(absolutePath, 'utf-8'), 'utf-8')
  }

  await writeManifest(projectDir)
  writeTracker(projectDir)
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('R11-2.A audit mode awareness', () => {
  it.each(SKILL_INSTALL_BASES)(
    'T-R11-2.A.1.1 audits clean skill-mode projects without legacy docs/core or docs/srs.md for %s',
    async (skillBase) => {
      const projectDir = await makeProject()
      await writeSkillCanonicalProject(projectDir, skillBase)

      const result = await runDoctorAudit(projectDir)
      const targetPaths = result.findings.map((finding) => finding.targetPath)

      expect(result.mode).toBe('skill')
      expect(result.skillBase).toBe(skillBase)
      expect(result.isClean).toBe(true)
      expect(result.findings).toEqual([])
      expect(targetPaths.some((targetPath) => targetPath === 'docs/core' || targetPath.startsWith('docs/core/'))).toBe(false)
      expect(targetPaths).not.toContain('docs/srs.md')
    },
  )

  it('T-R11-2.A.1.2 reports missing and drifted skill canonical files', async () => {
    const projectDir = await makeProject()
    const skillBase = '.claude/skills/blueprint'
    await writeSkillCanonicalProject(projectDir, skillBase)
    await rm(join(projectDir, skillBase, 'reference/align.md'))
    await writeFile(join(projectDir, skillBase, 'reference/tracker.md'), '# drifted tracker reference\n', 'utf-8')

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'missing-structure',
          targetPath: `${skillBase}/reference/align.md`,
        }),
        expect.objectContaining({
          kind: 'drifted-file',
          targetPath: `${skillBase}/reference/tracker.md`,
        }),
      ]),
    )
  })

  it('T-R11-2.A.1.3 follows the detected first-match skill base only', async () => {
    const projectDir = await makeProject()
    await writeSkillCanonicalProject(projectDir, '.claude/skills/blueprint')
    await writeSkillCanonicalProject(projectDir, '.agents/skills/blueprint')
    await rm(join(projectDir, '.agents/skills/blueprint/reference/align.md'))

    const agentsOnlyGap = await runDoctorAudit(projectDir)

    expect(agentsOnlyGap.mode).toBe('skill')
    expect(agentsOnlyGap.skillBase).toBe('.claude/skills/blueprint')
    expect(agentsOnlyGap.findings.map((finding) => finding.targetPath)).not.toContain(
      '.agents/skills/blueprint/reference/align.md',
    )

    await writeFile(join(projectDir, '.agents/skills/blueprint/reference/align.md'), '# not inspected\n', 'utf-8')
    await rm(join(projectDir, '.claude/skills/blueprint/reference/align.md'))

    const claudeGap = await runDoctorAudit(projectDir)

    expect(claudeGap.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: '.claude/skills/blueprint/reference/align.md',
      }),
    )
  })

  it('T-R11-2.A.1.4 still requires docs/tweaks in skill mode', async () => {
    const projectDir = await makeProject()
    const skillBase = '.claude/skills/blueprint'
    await writeSkillCanonicalProject(projectDir, skillBase)
    await rm(join(projectDir, 'docs/tweaks'), { recursive: true })

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: 'docs/tweaks',
        scope: 'directory',
      }),
    )
  })

  it('T-R11-2.A.1.5 preserves legacy audit findings and returns legacy mode metadata', async () => {
    const projectDir = await makeProject()
    await writeCanonicalProject(projectDir, { includeSrsDoc: false, includeTracker: true, managedFiles: [] })
    await rm(join(projectDir, 'docs/core/alignment.md'))

    const result = await runDoctorAudit(projectDir)

    expect(result.mode).toBe('legacy')
    expect(result.skillBase).toBeUndefined()
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'missing-structure',
          targetPath: 'docs/core/alignment.md',
        }),
        expect.objectContaining({
          kind: 'missing-structure',
          targetPath: 'docs/srs.md',
        }),
      ]),
    )
  })
})
