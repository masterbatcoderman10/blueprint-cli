import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'
import { writeCanonicalProject } from './test-project'

const tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-doctor-structure-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-B.2.1: Doctor reports missing required Blueprint structure', () => {
  it('includes missing-structure findings for each missing canonical path in an incomplete project', async () => {
    const projectDir = await makeTempDir()
    await mkdir(join(projectDir, 'docs'), { recursive: true })
    await writeFile(join(projectDir, 'docs', 'project-progress.md'), '# user-owned doc\n', 'utf-8')

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'missing-structure',
          targetPath: 'docs/core/alignment.md',
        }),
        expect.objectContaining({
          kind: 'missing-structure',
          targetPath: 'docs/core/health-check.md',
        }),
      ]),
    )
  })
})

describe('T-B.2.2: Doctor treats a missing manifest as a repairable legacy finding', () => {
  it('completes the audit and reports manifest bootstrap required instead of treating the project as invalid', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir, { includeManifest: false })

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-manifest',
        targetPath: MANIFEST_RELATIVE_PATH,
        repairable: true,
      }),
    )
  })
})

describe('T-B.2.3: Doctor ignores editable project docs for exact drift enforcement', () => {
  it('does not emit findings for docs/prd.md, docs/project-progress.md, or docs/conventions.md', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir, {
      editableDocs: {
        'docs/prd.md': '# edited prd\n',
        'docs/project-progress.md': '# edited progress\n',
        'docs/conventions.md': '# edited conventions\n',
      },
    })

    const result = await runDoctorAudit(projectDir)
    const targetPaths = result.findings.map((finding) => finding.targetPath)

    expect(targetPaths).not.toContain('docs/prd.md')
    expect(targetPaths).not.toContain('docs/project-progress.md')
    expect(targetPaths).not.toContain('docs/conventions.md')
  })
})
