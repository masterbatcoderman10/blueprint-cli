import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../../src/doctor/audit'
import { createRepairPlan } from '../../../src/doctor/repair'
import { executeRepairs } from '../../../src/doctor/executor'
import { resolveTemplatePath } from '../../../src/doctor/inventory'
import {
  CANONICAL_CORE_FILES,
  REQUIRED_BLUEPRINT_DIRECTORIES,
  REQUIRED_CANONICAL_FILES,
} from '../../../src/doctor/structure'

describe('Stream D — Doctor Canonical-Structure Test & Repair Coverage', () => {
  async function makeTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'blueprint-r7-d-'))
    return dir
  }

  async function writeMinimalProject(dir: string): Promise<void> {
    await mkdir(join(dir, 'docs', '.blueprint'), { recursive: true })
    await writeFile(
      join(dir, 'docs', 'project-progress.md'),
      '**Project**: test\n**Tagline**: test\n',
      'utf-8',
    )
    await writeFile(
      join(dir, 'docs', '.blueprint', 'manifest.json'),
      JSON.stringify({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] }),
    )
  }

  describe('T-R7-1.D.2: broad parameterized Doctor repair restores all missing canonical entries', () => {
    it('restores every missing required directory and file from template byte-for-byte', async () => {
      const projectDir = await makeTempDir()

      try {
        await writeMinimalProject(projectDir)

        const audit = await runDoctorAudit(projectDir)
        const plan = await createRepairPlan(audit.findings, projectDir)
        const result = await executeRepairs(plan.actions, projectDir)

        expect(result.success).toBe(true)
        expect(result.failed).toBe(0)

        // Parameterized over all required directories
        for (const dirPath of REQUIRED_BLUEPRINT_DIRECTORIES) {
          await expect(access(join(projectDir, dirPath))).resolves.toBeUndefined()
        }

        // Parameterized over all canonical core files
        for (const relativePath of CANONICAL_CORE_FILES) {
          const restored = await readFile(join(projectDir, relativePath), 'utf-8')
          const expected = await readFile(resolveTemplatePath(relativePath), 'utf-8')
          expect(restored, `${relativePath} should match template byte-for-byte`).toBe(expected)
        }

        // Parameterized over all required canonical files
        for (const relativePath of REQUIRED_CANONICAL_FILES) {
          const restored = await readFile(join(projectDir, relativePath), 'utf-8')
          const expected = await readFile(resolveTemplatePath(relativePath), 'utf-8')
          expect(restored, `${relativePath} should match template byte-for-byte`).toBe(expected)
        }

        // Post-repair audit should be clean for structure
        const reaudit = await runDoctorAudit(projectDir)
        const missingFindings = reaudit.findings.filter((f) => f.kind === 'missing-structure')
        expect(missingFindings).toHaveLength(0)
      } finally {
        await rm(projectDir, { recursive: true, force: true })
      }
    })
  })

  describe('T-R7-1.D.3: Doctor repair restores a single missing file in an existing directory', () => {
    it('restores only docs/tweaks/README.md when docs/tweaks/ exists but README.md is missing', async () => {
      const projectDir = await makeTempDir()

      try {
        await writeMinimalProject(projectDir)

        // Create all canonical files except docs/tweaks/README.md
        for (const relativePath of CANONICAL_CORE_FILES) {
          const dest = join(projectDir, relativePath)
          await mkdir(dirname(dest), { recursive: true })
          await writeFile(dest, await readFile(resolveTemplatePath(relativePath), 'utf-8'), 'utf-8')
        }

        // Create docs/tweaks/ directory but omit README.md
        await mkdir(join(projectDir, 'docs', 'tweaks'), { recursive: true })

        const audit = await runDoctorAudit(projectDir)
        const plan = await createRepairPlan(audit.findings, projectDir)
        const result = await executeRepairs(plan.actions, projectDir)

        expect(result.success).toBe(true)

        const restoredContent = await readFile(join(projectDir, 'docs', 'tweaks', 'README.md'), 'utf-8')
        const templateContent = await readFile(resolveTemplatePath('docs/tweaks/README.md'), 'utf-8')
        expect(restoredContent).toBe(templateContent)
      } finally {
        await rm(projectDir, { recursive: true, force: true })
      }
    })
  })

  describe('T-R7-1.D.4: Doctor repair never overwrites an existing required canonical file', () => {
    it('leaves docs/tweaks/README.md untouched when it contains arbitrary user content', async () => {
      const projectDir = await makeTempDir()

      try {
        await writeMinimalProject(projectDir)

        // Create all canonical files with template content
        for (const relativePath of CANONICAL_CORE_FILES) {
          const dest = join(projectDir, relativePath)
          await mkdir(dirname(dest), { recursive: true })
          await writeFile(dest, await readFile(resolveTemplatePath(relativePath), 'utf-8'), 'utf-8')
        }

        // Create docs/tweaks/ directory and README.md with drifted content
        await mkdir(join(projectDir, 'docs', 'tweaks'), { recursive: true })
        const userContent = '# Arbitrary user content\n\nThis is not the template.\n'
        await writeFile(join(projectDir, 'docs', 'tweaks', 'README.md'), userContent, 'utf-8')

        const audit = await runDoctorAudit(projectDir)
        const plan = await createRepairPlan(audit.findings, projectDir)
        const result = await executeRepairs(plan.actions, projectDir)

        expect(result.success).toBe(true)

        const content = await readFile(join(projectDir, 'docs', 'tweaks', 'README.md'), 'utf-8')
        expect(content).toBe(userContent)
      } finally {
        await rm(projectDir, { recursive: true, force: true })
      }
    })
  })
})
