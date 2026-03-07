/**
 * Stream C — Repair & Update Flow
 * Task C.3: Doctor End-to-End Flow Tests
 * 
 * Tests for the complete Doctor flow: analyze, present findings,
 * confirm repairs, execute fixes, rerun validation, and show summary.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { invokeCli } from '../../helpers/cli'
import { writeCanonicalProject } from '../stream-b/test-project'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>()
  return {
    ...actual,
    intro: vi.fn(),
    log: {
      ...actual.log,
    },
    confirm: vi.fn(() => Promise.resolve(true)),
    cancel: vi.fn(),
  }
})

const tempDirs: string[] = []

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
  vi.clearAllMocks()
})

describe('T-C.3: Doctor End-to-End Flow', () => {
  describe('T-C.3.1: Full repair flow with post-repair validation', () => {
    it('analyzes, repairs, reruns validation, and reports clean result', async () => {
      const projectDir = await mkdtempJoinTmpdir('blueprint-doctor-e2e-')
      await writeCanonicalProject(projectDir)

      const executionPath = join(projectDir, 'docs', 'core', 'execution.md')
      await writeFile(executionPath, '# Drifted Content\n')

      const originalCwd = process.cwd()
      process.chdir(projectDir)

      try {
        const result = await invokeCli(['doctor'])
        
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Blueprint Doctor')
        expect(result.stdout).toContain('repair')
        expect(result.stdout).toContain('clean')
      } finally {
        process.chdir(originalCwd)
      }

      const repairedContent = await readFile(executionPath, 'utf-8')
      expect(repairedContent).not.toContain('# Drifted Content')
      
      const manifestContent = await readFile(
        join(projectDir, MANIFEST_RELATIVE_PATH),
        'utf-8'
      )
      const manifest = JSON.parse(manifestContent)
      expect(manifest.templateVersion).toBe(TEMPLATE_VERSION)
    })
  })

  describe('T-C.3.2: Doctor reports clean project', () => {
    it('exits with 0 and reports no issues for a clean canonical project', async () => {
      const projectDir = await mkdtempJoinTmpdir('blueprint-doctor-clean-')
      await writeCanonicalProject(projectDir)

      const originalCwd = process.cwd()
      process.chdir(projectDir)

      try {
        const result = await invokeCli(['doctor'])
        
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('clean')
      } finally {
        process.chdir(originalCwd)
      }
    })
  })

  describe('T-C.3.3: User declines repairs', () => {
    it('leaves working tree unchanged when repairs are cancelled', async () => {
      const projectDir = await mkdtempJoinTmpdir('blueprint-doctor-cancel-')
      await writeCanonicalProject(projectDir)

      const executionPath = join(projectDir, 'docs', 'core', 'execution.md')
      await writeFile(executionPath, '# Drifted Content\n')

      const clackPrompts = await import('@clack/prompts')
      vi.mocked(clackPrompts.confirm).mockReturnValueOnce(Promise.resolve(false))

      const originalCwd = process.cwd()
      process.chdir(projectDir)

      try {
        const result = await invokeCli(['doctor'])
        
        expect(result.exitCode).toBe(0)
      } finally {
        process.chdir(originalCwd)
      }
      
      const content = await readFile(executionPath, 'utf-8')
      expect(content).toContain('# Drifted Content')
    })
  })

  describe('Doctor flow edge cases', () => {
    it('handles blocking manifest validation error', async () => {
      const projectDir = await mkdtempJoinTmpdir('blueprint-doctor-blocking-')
      await writeCanonicalProject(projectDir)
      
      await writeFile(
        join(projectDir, MANIFEST_RELATIVE_PATH),
        'invalid json {{{'
      )

      const originalCwd = process.cwd()
      process.chdir(projectDir)

      try {
        const result = await invokeCli(['doctor'])
        
        expect(result.exitCode).toBe(1)
        expect(result.stdout).toContain('Manifest validation errors')
      } finally {
        process.chdir(originalCwd)
      }
    })
  })
})

async function mkdtempJoinTmpdir(prefix: string): Promise<string> {
  const fs = await import('node:fs/promises')
  const dir = await fs.mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}
