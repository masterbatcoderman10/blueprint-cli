import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'
import { invokeCli } from '../../helpers/cli'
import { writeCanonicalProject } from './test-project'

const tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-doctor-manifest-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('Review regression: malformed manifest contents are surfaced as a validation problem', () => {
  it('runDoctorAudit returns a manifest-validation-error finding instead of throwing', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await writeFile(
      join(projectDir, MANIFEST_RELATIVE_PATH),
      JSON.stringify({ templateVersion: '1.0.0', managedFiles: ['CLAUDE.md'] }, null, 2),
      'utf-8',
    )

    await expect(runDoctorAudit(projectDir)).resolves.toEqual(
      expect.objectContaining({
        isClean: false,
        hasBlockingFindings: true,
        findings: expect.arrayContaining([
          expect.objectContaining({
            kind: 'manifest-validation-error',
            targetPath: MANIFEST_RELATIVE_PATH,
            repairable: false,
          }),
        ]),
      }),
    )
  })

  it('blueprint doctor reports the validation issue and exits non-zero', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await writeFile(join(projectDir, MANIFEST_RELATIVE_PATH), '{ invalid json', 'utf-8')

    const originalCwd = process.cwd()
    process.chdir(projectDir)

    try {
      const result = await invokeCli(['doctor'])
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('Manifest validation errors:')
      expect(result.stdout).toContain(MANIFEST_RELATIVE_PATH)
    } finally {
      process.chdir(originalCwd)
    }
  })
})
