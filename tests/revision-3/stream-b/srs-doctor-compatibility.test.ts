import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { executeRepairs } from '../../../src/doctor/executor'
import { resolveTemplatePath } from '../../../src/doctor/inventory'
import { createRepairPlan } from '../../../src/doctor/repair'
import { isEditableProjectDoc } from '../../../src/doctor/structure'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeTempDir(projectName?: string): Promise<string> {
  const parentDir = await mkdtemp(join(tmpdir(), 'blueprint-r3-stream-b-'))
  tempDirs.push(parentDir)

  if (!projectName) {
    return parentDir
  }

  const projectDir = join(parentDir, projectName)
  await mkdir(projectDir, { recursive: true })
  return projectDir
}

async function writeCustomSrsDoc(projectDir: string, content = '# Custom SRS\n'): Promise<void> {
  const srsPath = join(projectDir, 'docs', 'srs.md')
  await mkdir(join(projectDir, 'docs'), { recursive: true })
  await writeFile(srsPath, content, 'utf-8')
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-R3-1.B.2.1: Doctor structure marks docs/srs.md as a user-owned editable project doc', () => {
  it('returns true for docs/srs.md', () => {
    expect(isEditableProjectDoc('docs/srs.md')).toBe(true)
  })
})

describe('T-R3-1.B.2.2: Doctor audit on a legacy project missing docs/srs.md returns a repairable finding', () => {
  it('reports docs/srs.md as a missing repairable file', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: 'docs/srs.md',
        repairable: true,
        scope: 'file',
      }),
    )
  })
})

describe('T-R3-1.B.2.3: Doctor does not emit drift findings for customized docs/srs.md content', () => {
  it('ignores user-edited SRS content once docs/srs.md exists', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await writeCustomSrsDoc(projectDir, '# Customized SRS\n')

    const result = await runDoctorAudit(projectDir)
    const targetPaths = result.findings.map((finding) => finding.targetPath)

    expect(targetPaths).not.toContain('docs/srs.md')
  })
})

describe('T-R3-1.B.2.4: Doctor repair restores docs/srs.md from the bundled template', () => {
  it('creates docs/srs.md with project-name interpolation and clears the missing-file finding on re-audit', async () => {
    const projectDir = await makeTempDir('legacy-srs-project')
    await writeCanonicalProject(projectDir)

    const firstAudit = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(firstAudit.findings, projectDir)
    const srsAction = repairPlan.actions.find((action) => action.targetPath === 'docs/srs.md')

    expect(srsAction).toBeDefined()
    expect(srsAction?.type).toBe('create-from-template')
    expect(srsAction?.templatePath).toBe(resolveTemplatePath('docs/srs.md'))

    const repairResult = await executeRepairs(repairPlan.actions, projectDir)
    expect(repairResult.success).toBe(true)

    const repairedSrsPath = join(projectDir, 'docs', 'srs.md')
    await expect(access(repairedSrsPath)).resolves.toBeUndefined()
    const repairedSrsContent = await readFile(repairedSrsPath, 'utf-8')
    expect(repairedSrsContent).toContain('# legacy-srs-project - Software Requirements Specification')
    expect(repairedSrsContent).not.toContain('{{project-name}}')

    const secondAudit = await runDoctorAudit(projectDir)
    const srsFindings = secondAudit.findings.filter((finding) => finding.targetPath === 'docs/srs.md')
    expect(srsFindings).toHaveLength(0)
  })
})

describe('T-R3-1.B.3.1: Legacy project upgrade path remains stable through audit -> repair -> re-audit', () => {
  it('reaches a clean post-repair state without affecting other editable docs and interpolates the repaired SRS shell', async () => {
    const projectDir = await makeTempDir('compat-upgrade-project')
    await writeCanonicalProject(projectDir, {
      editableDocs: {
        'docs/prd.md': '# Custom PRD\n',
        'docs/project-progress.md': '# Custom Progress\n',
        'docs/conventions.md': '# Custom Conventions\n',
      },
    })

    const firstAudit = await runDoctorAudit(projectDir)
    expect(firstAudit.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: 'docs/srs.md',
      }),
    )

    const repairPlan = await createRepairPlan(firstAudit.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)
    expect(repairResult.success).toBe(true)

    const secondAudit = await runDoctorAudit(projectDir)
    expect(secondAudit.isClean).toBe(true)

    await expect(access(join(projectDir, 'docs', 'srs.md'))).resolves.toBeUndefined()
    await expect(access(join(projectDir, 'docs', 'prd.md'))).resolves.toBeUndefined()
    await expect(access(join(projectDir, 'docs', 'project-progress.md'))).resolves.toBeUndefined()
    await expect(access(join(projectDir, 'docs', 'conventions.md'))).resolves.toBeUndefined()

    const repairedSrsContent = await readFile(join(projectDir, 'docs', 'srs.md'), 'utf-8')
    expect(repairedSrsContent).toContain('# compat-upgrade-project - Software Requirements Specification')
    expect(repairedSrsContent).not.toContain('{{project-name}}')

    await expect(readFile(join(projectDir, 'docs', 'prd.md'), 'utf-8')).resolves.toBe('# Custom PRD\n')
    await expect(readFile(join(projectDir, 'docs', 'project-progress.md'), 'utf-8')).resolves.toBe('# Custom Progress\n')
    await expect(readFile(join(projectDir, 'docs', 'conventions.md'), 'utf-8')).resolves.toBe('# Custom Conventions\n')
  })
})
