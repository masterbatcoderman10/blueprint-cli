import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { writeCanonicalProject } from './test-project'

const tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-doctor-content-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-B.3.1: Doctor detects drift in a docs/core file', () => {
  it('emits a drifted-file finding when a canonical core file no longer matches the bundled template', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await writeFile(join(projectDir, 'docs/core/execution.md'), '# drifted execution\n', 'utf-8')

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'drifted-file',
        targetPath: 'docs/core/execution.md',
      }),
    )
  })
})

describe('T-B.3.2: Doctor detects drift in a manifest-managed root agent file', () => {
  it('emits a drifted-file finding for a managed root agent file that differs from its bundled template', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir, { managedFiles: ['CLAUDE.md'] })
    await writeFile(join(projectDir, 'CLAUDE.md'), '# drifted claude\n', 'utf-8')

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'drifted-file',
        targetPath: 'CLAUDE.md',
      }),
    )
  })
})

describe('T-B.3.3: Doctor ignores non-managed root agent files', () => {
  it('does not emit a drift finding for supported agent files that are not listed in the manifest', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir, { managedFiles: ['CLAUDE.md'] })
    await writeFile(join(projectDir, 'AGENTS.md'), '# user-owned root agent file\n', 'utf-8')

    const result = await runDoctorAudit(projectDir)
    const targetPaths = result.findings.map((finding) => finding.targetPath)

    expect(targetPaths).not.toContain('AGENTS.md')
  })
})

describe('T-B.3.4: Doctor reports a clean result when all canonical files match', () => {
  it('returns no integrity findings for a fully aligned Blueprint project', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir, { managedFiles: ['CLAUDE.md', 'AGENTS.md'] })

    const result = await runDoctorAudit(projectDir)

    expect(result.isClean).toBe(true)
    expect(result.findings).toEqual([])
  })
})
