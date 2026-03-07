import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { placeholderCommands } from '../../../src/commands'
import { createCommandRuntime } from '../../../src/runtime'
import { invokeCli } from '../../helpers/cli'
import { writeCanonicalProject } from './test-project'

const tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'blueprint-doctor-command-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-B.1.1: Doctor is registered in the CLI runtime', () => {
  it('includes doctor alongside the existing commands', () => {
    const runtime = createCommandRuntime()

    for (const command of placeholderCommands) {
      runtime.register(command)
    }

    expect(runtime.listCommands()).toContain('doctor')
  })
})

describe('T-B.1.2: CLI dispatch invokes doctor through runCli([\'doctor\'])', () => {
  it('returns exitCode 0 for a valid Blueprint project', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)

    const originalCwd = process.cwd()
    process.chdir(projectDir)

    try {
      const result = await invokeCli(['doctor'])
      expect(result.exitCode).toBe(0)
    } finally {
      process.chdir(originalCwd)
    }
  })
})
