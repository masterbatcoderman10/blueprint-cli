import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'
import { invokeCli } from '../../helpers/cli'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>()
  return {
    ...actual,
    intro: vi.fn(),
    cancel: vi.fn(),
    confirm: vi.fn(() => Promise.resolve(true)),
    log: {
      ...actual.log,
    },
  }
})

const tempDirs: string[] = []

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
  vi.clearAllMocks()
})

describe('T-A.3.1: doctor reports malformed metadata with actionable validation output', () => {
  it('fails cleanly when the manifest schema is invalid', async () => {
    const projectDir = await mkdtempJoinTmpdir('blueprint-phase4-doctor-')
    await writeCanonicalProject(projectDir)

    await writeFile(
      join(projectDir, MANIFEST_RELATIVE_PATH),
      JSON.stringify(
        {
          templateVersion: '1.0.0',
          managedFiles: 'CLAUDE.md',
        },
        null,
        2,
      ),
      'utf-8',
    )

    const result = await runCliInProject(projectDir, ['doctor'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('Manifest validation errors')
    expect(result.stdout).toContain('failed schema validation')
  })
})

describe('T-A.3.2: doctor repairs mixed missing and drifted canonical files together', () => {
  it('detects both classes of issues and repairs them in one cycle', async () => {
    const projectDir = await mkdtempJoinTmpdir('blueprint-phase4-doctor-')
    await writeCanonicalProject(projectDir)

    const missingPath = join(projectDir, 'docs', 'core', 'review.md')
    const driftedPath = join(projectDir, 'docs', 'core', 'execution.md')

    await unlink(missingPath)
    await writeFile(driftedPath, '# Drifted Content\n', 'utf-8')

    const result = await runCliInProject(projectDir, ['doctor'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Missing structure')
    expect(result.stdout).toContain('Drifted canonical files')
    expect(result.stdout).toContain('Successfully applied 2 repair(s).')

    expect(await readFile(missingPath, 'utf-8')).toContain('# Review')
    expect(await readFile(driftedPath, 'utf-8')).not.toContain('# Drifted Content')
  })
})

describe('T-A.3.3: doctor decline and post-repair revalidation flow', () => {
  it('leaves the project unchanged when repair is declined, then reaches a stable clean state after acceptance', async () => {
    const projectDir = await mkdtempJoinTmpdir('blueprint-phase4-doctor-')
    await writeCanonicalProject(projectDir)

    const driftedPath = join(projectDir, 'docs', 'core', 'execution.md')
    await writeFile(driftedPath, '# Drifted Content\n', 'utf-8')

    const clackPrompts = await import('@clack/prompts')
    vi.mocked(clackPrompts.confirm)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    const declined = await runCliInProject(projectDir, ['doctor'])
    expect(declined.exitCode).toBe(0)
    expect(await readFile(driftedPath, 'utf-8')).toBe('# Drifted Content\n')

    const repaired = await runCliInProject(projectDir, ['doctor'])
    expect(repaired.exitCode).toBe(0)
    expect(await readFile(driftedPath, 'utf-8')).not.toContain('# Drifted Content')

    const stable = await runCliInProject(projectDir, ['doctor'])
    expect(stable.exitCode).toBe(0)
    expect(stable.stdout).toContain('Project integrity is clean. No repairs needed.')
  })
})

async function mkdtempJoinTmpdir(prefix: string): Promise<string> {
  const fs = await import('node:fs/promises')
  const dir = await fs.mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function runCliInProject(projectDir: string, argv: string[]) {
  const originalCwd = process.cwd()

  try {
    await mkdir(projectDir, { recursive: true })
    process.chdir(projectDir)
    return await invokeCli(argv)
  } finally {
    process.chdir(originalCwd)
  }
}
