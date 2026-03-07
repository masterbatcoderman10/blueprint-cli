/**
 * Stream C — Repair & Update Flow
 * Task C.2: Repair Executor Tests
 * 
 * Tests for the repair executor that applies planned repairs.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeRepairs, renderRepairResult } from '../../../src/doctor/executor'
import type { RepairAction } from '../../../src/doctor/repair'
import { MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION } from '../../../src/doctor/manifest'

describe('T-C.2: Repair Executor', () => {
  let projectDir: string

  beforeEach(async () => {
    // Create a unique temp directory for each test
    projectDir = await mkdtemp(join(tmpdir(), 'blueprint-doctor-test-'))
  })

  async function mkdtemp(prefix: string): Promise<string> {
    const fs = await import('node:fs/promises')
    return fs.mkdtemp(prefix)
  }

  describe('T-C.2.1: Restore missing docs/core files', () => {
    it('creates missing canonical file from bundled template', async () => {
      const templateContent = '# Test Template Content\n'
      
      // Write a template file
      const templatesDir = join(projectDir, 'templates', 'docs', 'core')
      await mkdir(templatesDir, { recursive: true })
      const templatePath = join(templatesDir, 'test-file.md')
      await writeFile(templatePath, templateContent)

      const actions: RepairAction[] = [
        {
          type: 'create-from-template',
          targetPath: 'docs/core/test-file.md',
          templatePath,
          description: 'Create missing file from template',
        },
      ]

      const result = await executeRepairs(actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.applied).toBe(1)
      expect(result.failed).toBe(0)

      // Verify file was created with correct content
      const createdFile = join(projectDir, 'docs/core/test-file.md')
      const content = await readFile(createdFile, 'utf-8')
      expect(content).toBe(templateContent)
    })
  })

  describe('T-C.2.2: Replace drifted managed agent file', () => {
    it('replaces drifted file in place without archive', async () => {
      const originalContent = '# Old Content\n'
      const templateContent = '# New Template Content\n'

      // Create existing file with old content
      const targetPath = join(projectDir, 'CLAUDE.md')
      await mkdir(projectDir, { recursive: true })
      await writeFile(targetPath, originalContent)

      // Create template
      const templatesDir = join(projectDir, 'templates')
      await mkdir(templatesDir, { recursive: true })
      const templatePath = join(templatesDir, 'CLAUDE.md')
      await writeFile(templatePath, templateContent)

      const actions: RepairAction[] = [
        {
          type: 'replace-in-place',
          targetPath: 'CLAUDE.md',
          templatePath,
          description: 'Replace drifted managed agent file',
        },
      ]

      const result = await executeRepairs(actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.applied).toBe(1)

      // Verify file was replaced (not archived)
      const content = await readFile(targetPath, 'utf-8')
      expect(content).toBe(templateContent)

      // Verify no archive was created
      const archivePath = join(projectDir, 'knowledge-base', 'CLAUDE.md')
      await expect(readFile(archivePath, 'utf-8')).rejects.toThrow()
    })
  })

  describe('T-C.2.3: Bootstrap manifest for legacy project', () => {
    it('creates manifest with detected managed files', async () => {
      // Create some agent files to be detected
      await mkdir(projectDir, { recursive: true })
      await writeFile(join(projectDir, 'CLAUDE.md'), '# CLAUDE\n')
      await writeFile(join(projectDir, 'GEMINI.md'), '# GEMINI\n')

      const actions: RepairAction[] = [
        {
          type: 'bootstrap-manifest',
          targetPath: MANIFEST_RELATIVE_PATH,
          manifestData: {
            templateVersion: TEMPLATE_VERSION,
            cliVersion: '0.1.0',
            managedFiles: ['CLAUDE.md', 'GEMINI.md'],
          },
          description: 'Bootstrap manifest for legacy project',
        },
      ]

      const result = await executeRepairs(actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.applied).toBe(1)

      // Verify manifest was created
      const manifestPath = join(projectDir, MANIFEST_RELATIVE_PATH)
      const manifestContent = await readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)

      expect(manifest.templateVersion).toBe(TEMPLATE_VERSION)
      expect(manifest.cliVersion).toBe('0.1.0')
      expect(manifest.managedFiles).toEqual(['CLAUDE.md', 'GEMINI.md'])
    })
  })

  describe('T-C.2.4: Combined repairs', () => {
    it('applies multiple repairs in one run', async () => {
      const templateContent = '# Template\n'
      
      // Setup templates
      const templatesDir = join(projectDir, 'templates', 'docs', 'core')
      await mkdir(templatesDir, { recursive: true })
      const templatePath = join(templatesDir, 'execution.md')
      await writeFile(templatePath, templateContent)

      // Create existing drifted file
      await writeFile(join(projectDir, 'CLAUDE.md'), '# Old\n')
      const claudeTemplatePath = join(templatesDir, 'CLAUDE.md')
      await writeFile(claudeTemplatePath, '# New\n')

      const actions: RepairAction[] = [
        {
          type: 'create-from-template',
          targetPath: 'docs/core/execution.md',
          templatePath,
          description: 'Create missing execution.md',
        },
        {
          type: 'replace-in-place',
          targetPath: 'CLAUDE.md',
          templatePath: claudeTemplatePath,
          description: 'Replace CLAUDE.md',
        },
      ]

      const result = await executeRepairs(actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.applied).toBe(2)
      expect(result.failed).toBe(0)

      // Verify both files
      const executionFile = join(projectDir, 'docs/core/execution.md')
      expect(await readFile(executionFile, 'utf-8')).toBe(templateContent)
      expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe('# New\n')
    })
  })

  describe('T-C.2.5: Does not create unselected agent files', () => {
    it('only writes files specified in actions', async () => {
      const templateContent = '# Template\n'
      
      const templatesDir = join(projectDir, 'templates')
      await mkdir(templatesDir, { recursive: true })
      const templatePath = join(templatesDir, 'CLAUDE.md')
      await writeFile(templatePath, templateContent)

      // Only create action for CLAUDE.md, not other agents
      const actions: RepairAction[] = [
        {
          type: 'replace-in-place',
          targetPath: 'CLAUDE.md',
          templatePath,
          description: 'Replace CLAUDE.md only',
        },
      ]

      const result = await executeRepairs(actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.applied).toBe(1)

      // Verify CLAUDE.md exists
      expect(await readFile(join(projectDir, 'CLAUDE.md'), 'utf-8')).toBe(templateContent)

      // Verify other agent files were NOT created
      await expect(readFile(join(projectDir, 'AGENTS.md'), 'utf-8')).rejects.toThrow()
      await expect(readFile(join(projectDir, 'GEMINI.md'), 'utf-8')).rejects.toThrow()
      await expect(readFile(join(projectDir, 'QWEN.md'), 'utf-8')).rejects.toThrow()
    })
  })

  describe('renderRepairResult', () => {
    it('renders success message', () => {
      const result = { success: true, applied: 3, failed: 0, errors: [] }
      const output = renderRepairResult(result)

      expect(output).toContain('Successfully applied 3 repair(s)')
    })

    it('renders partial failure message', () => {
      const result = {
        success: false,
        applied: 2,
        failed: 1,
        errors: ['File not found'],
      }
      const output = renderRepairResult(result)

      expect(output).toContain('Applied 2 repair(s), 1 failed')
      expect(output).toContain('Errors:')
      expect(output).toContain('File not found')
    })
  })
})
