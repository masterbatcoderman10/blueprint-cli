import { mkdir, mkdtemp, rm, writeFile, readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  scaffoldBlueprintDirectory,
  executeScaffold,
} from '../../../src/init/archive-engine'
import { type InitOptions, defaultArchiveDirectoryName } from '../../../src/init/types'
import { directoryExists } from '../../../src/init/fs-utils'
import {
  REQUIRED_BLUEPRINT_DIRECTORIES,
  REQUIRED_CANONICAL_FILES,
  CANONICAL_CORE_FILES,
} from '../../../src/doctor/structure'
import { runDoctorAudit } from '../../../src/doctor/audit'
import { createRepairPlan } from '../../../src/doctor/repair'
import { executeRepairs } from '../../../src/doctor/executor'
import { resolveTemplatePath } from '../../../src/doctor/inventory'

describe('Stream A — Scaffold Engine & Doctor Repair', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'blueprint-r7-1-a-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('T-R7-1.A.1.1: blueprint init scaffold produces docs/tweaks/README.md', () => {
    it('creates docs/tweaks/ directory and copies README.md from template', async () => {
      const options: InitOptions = {
        projectName: 'test-project',
        git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
        docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
        markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
        agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
        confirmation: { confirmed: true },
      }

      await scaffoldBlueprintDirectory(tempDir, options)

      await expect(directoryExists(join(tempDir, 'docs', 'tweaks'))).resolves.toBe(true)

      const readmePath = join(tempDir, 'docs', 'tweaks', 'README.md')
      const content = await readFile(readmePath, 'utf-8')
      expect(content).toContain('docs/core/tweak-planning.md')
      expect(content).toContain('tweak-<n>-<slug>.md')
    })
  })

  describe('T-R7-1.A.2: structure.ts required-structure set includes docs/tweaks/ and README.md', () => {
    it('includes docs/tweaks/ in REQUIRED_BLUEPRINT_DIRECTORIES', () => {
      expect(REQUIRED_BLUEPRINT_DIRECTORIES).toContain('docs/tweaks')
    })

    it('includes docs/tweaks/README.md in REQUIRED_CANONICAL_FILES', () => {
      expect(REQUIRED_CANONICAL_FILES).toContain('docs/tweaks/README.md')
    })
  })

  describe('T-R7-1.A.3.1: Doctor repair restores missing canonical entries byte-for-byte', () => {
    it('restores every missing required directory and file from template', async () => {
      const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r7-repair-'))

      // Create minimal project with only docs/ and docs/core/ (missing docs/tweaks/)
      await mkdir(join(projectDir, 'docs', 'core'), { recursive: true })
      await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })
      await writeFile(join(projectDir, 'docs', 'project-progress.md'), '**Project**: test\n**Tagline**: test\n')
      await writeFile(
        join(projectDir, 'docs', '.blueprint', 'manifest.json'),
        JSON.stringify({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] }),
      )

      // Copy a subset of core files so some are present and some missing
      for (const coreFile of CANONICAL_CORE_FILES.slice(0, 5)) {
        const dest = join(projectDir, coreFile)
        await mkdir(join(dest, '..'), { recursive: true })
        await writeFile(dest, await readFile(resolveTemplatePath(coreFile), 'utf-8'), 'utf-8')
      }

      const audit = await runDoctorAudit(projectDir)
      const plan = await createRepairPlan(audit.findings, projectDir)
      const result = await executeRepairs(plan.actions, projectDir)

      expect(result.success).toBe(true)
      expect(result.failed).toBe(0)

      // Verify docs/tweaks/ was created
      await expect(access(join(projectDir, 'docs', 'tweaks'))).resolves.toBeUndefined()

      // Verify docs/tweaks/README.md matches template byte-for-byte
      const restoredContent = await readFile(join(projectDir, 'docs', 'tweaks', 'README.md'), 'utf-8')
      const templateContent = await readFile(resolveTemplatePath('docs/tweaks/README.md'), 'utf-8')
      expect(restoredContent).toBe(templateContent)

      // Verify missing canonical core files were restored byte-for-byte
      const missingCoreFiles = ['docs/core/orchestrate.md', 'docs/core/tracker.md', 'docs/core/tweak-planning.md']
      for (const coreFile of missingCoreFiles) {
        const restored = await readFile(join(projectDir, coreFile), 'utf-8')
        const expected = await readFile(resolveTemplatePath(coreFile), 'utf-8')
        expect(restored, `${coreFile} should match template byte-for-byte`).toBe(expected)
      }

      await rm(projectDir, { recursive: true, force: true })
    })

    it('probe entry injected into required-set proves generic dispatch', async () => {
      const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r7-probe-'))
      const probeFile = 'docs/tweaks/PROBE.md'
      const probeTemplatePath = join(__dirname, '../../../templates', probeFile)
      const probeContent = '# Probe Template\n'

      // Inject probe into required canonical files
      REQUIRED_CANONICAL_FILES.push(probeFile)
      await mkdir(join(probeTemplatePath, '..'), { recursive: true })
      await writeFile(probeTemplatePath, probeContent, 'utf-8')

      try {
        await mkdir(join(projectDir, 'docs', 'core'), { recursive: true })
        await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })
        await writeFile(join(projectDir, 'docs', 'project-progress.md'), '**Project**: test\n**Tagline**: test\n')
        await writeFile(
          join(projectDir, 'docs', '.blueprint', 'manifest.json'),
          JSON.stringify({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] }),
        )
        for (const coreFile of CANONICAL_CORE_FILES) {
          const dest = join(projectDir, coreFile)
          await mkdir(join(dest, '..'), { recursive: true })
          await writeFile(dest, await readFile(resolveTemplatePath(coreFile), 'utf-8'), 'utf-8')
        }
        // Also create tweaks dir and README so only probe is missing
        await mkdir(join(projectDir, 'docs', 'tweaks'), { recursive: true })
        await writeFile(
          join(projectDir, 'docs', 'tweaks', 'README.md'),
          await readFile(resolveTemplatePath('docs/tweaks/README.md'), 'utf-8'),
          'utf-8',
        )

        const audit = await runDoctorAudit(projectDir)
        const plan = await createRepairPlan(audit.findings, projectDir)
        const result = await executeRepairs(plan.actions, projectDir)

        expect(result.success).toBe(true)
        const restoredProbe = await readFile(join(projectDir, probeFile), 'utf-8')
        expect(restoredProbe).toBe(probeContent)
      } finally {
        REQUIRED_CANONICAL_FILES.pop()
        await rm(probeTemplatePath, { force: true })
        await rm(projectDir, { recursive: true, force: true })
      }
    })
  })

  describe('T-R7-1.A.3.2: Doctor repair never overwrites existing required files', () => {
    it('leaves every existing required file untouched regardless of drift', async () => {
      const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r7-no-overwrite-'))

      await mkdir(join(projectDir, 'docs', 'core'), { recursive: true })
      await mkdir(join(projectDir, 'docs', 'tweaks'), { recursive: true })
      await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })
      await writeFile(join(projectDir, 'docs', 'project-progress.md'), '**Project**: test\n**Tagline**: test\n')
      await writeFile(
        join(projectDir, 'docs', '.blueprint', 'manifest.json'),
        JSON.stringify({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] }),
      )

      // Write all canonical files with drifted content
      const driftedContent = '# Drifted by user\n'
      for (const coreFile of CANONICAL_CORE_FILES) {
        const dest = join(projectDir, coreFile)
        await mkdir(join(dest, '..'), { recursive: true })
        await writeFile(dest, driftedContent, 'utf-8')
      }
      await writeFile(join(projectDir, 'docs', 'tweaks', 'README.md'), driftedContent, 'utf-8')

      const audit = await runDoctorAudit(projectDir)
      const plan = await createRepairPlan(audit.findings, projectDir)
      const result = await executeRepairs(plan.actions, projectDir)

      expect(result.success).toBe(true)

      // Verify no canonical file was overwritten
      for (const coreFile of CANONICAL_CORE_FILES) {
        const content = await readFile(join(projectDir, coreFile), 'utf-8')
        expect(content).toBe(driftedContent)
      }
      const tweaksReadme = await readFile(join(projectDir, 'docs', 'tweaks', 'README.md'), 'utf-8')
      expect(tweaksReadme).toBe(driftedContent)

      await rm(projectDir, { recursive: true, force: true })
    })
  })

  describe('T-R7-1.A.3.3: Doctor repair restores a single missing file in an existing directory', () => {
    it('restores only the missing README.md when docs/tweaks/ exists', async () => {
      const projectDir = await mkdtemp(join(tmpdir(), 'blueprint-r7-partial-'))

      await mkdir(join(projectDir, 'docs', 'core'), { recursive: true })
      await mkdir(join(projectDir, 'docs', 'tweaks'), { recursive: true })
      await mkdir(join(projectDir, 'docs', '.blueprint'), { recursive: true })
      await writeFile(join(projectDir, 'docs', 'project-progress.md'), '**Project**: test\n**Tagline**: test\n')
      await writeFile(
        join(projectDir, 'docs', '.blueprint', 'manifest.json'),
        JSON.stringify({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] }),
      )
      for (const coreFile of CANONICAL_CORE_FILES) {
        const dest = join(projectDir, coreFile)
        await mkdir(join(dest, '..'), { recursive: true })
        await writeFile(dest, await readFile(resolveTemplatePath(coreFile), 'utf-8'), 'utf-8')
      }

      const audit = await runDoctorAudit(projectDir)
      const plan = await createRepairPlan(audit.findings, projectDir)
      const result = await executeRepairs(plan.actions, projectDir)

      expect(result.success).toBe(true)

      const restoredContent = await readFile(join(projectDir, 'docs', 'tweaks', 'README.md'), 'utf-8')
      const templateContent = await readFile(resolveTemplatePath('docs/tweaks/README.md'), 'utf-8')
      expect(restoredContent).toBe(templateContent)

      await rm(projectDir, { recursive: true, force: true })
    })
  })

  describe('T-R7-1.A.1.2: blueprint init summary report lists docs/tweaks/ in created directories', () => {
    it('executeScaffold includes docs/tweaks/ in createdDirectories and docs/tweaks/README.md in createdFiles', async () => {
      const options: InitOptions = {
        projectName: 'test-project',
        git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
        docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
        markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
        agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
        confirmation: { confirmed: true },
      }

      const result = await executeScaffold(tempDir, options)

      expect(result.createdDirectories).toContain('docs/tweaks/')
      expect(result.createdFiles).toContain('docs/tweaks/README.md')
    })
  })
})
