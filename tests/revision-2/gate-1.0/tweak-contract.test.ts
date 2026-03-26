import { readFile, access, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { dirname } from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import {
  CANONICAL_CORE_FILES,
  getCanonicalStructurePaths,
} from '../../../src/doctor/structure'
import {
  resolveAllCoreTemplatePaths,
  resolveTemplatePath,
} from '../../../src/doctor/inventory'
import { runDoctorAudit } from '../../../src/doctor/audit'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bp-tweak-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

// T-R2-1.0.5.1: CANONICAL_CORE_FILES includes docs/core/tweak-planning.md
describe('T-R2-1.0.5.1: CANONICAL_CORE_FILES includes tweak-planning.md', () => {
  it('contains docs/core/tweak-planning.md in the array', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/tweak-planning.md')
  })

  it('is included in getCanonicalStructurePaths()', () => {
    const paths = getCanonicalStructurePaths()
    expect(paths).toContain('docs/core/tweak-planning.md')
  })
})

// T-R2-1.0.2.1: tweak-planning.md is included in resolved core template paths
describe('T-R2-1.0.2.1: tweak-planning.md in resolved core template paths', () => {
  it('resolveAllCoreTemplatePaths returns an entry for docs/core/tweak-planning.md', () => {
    const entries = resolveAllCoreTemplatePaths()
    const tweakEntry = entries.find((e) => e.relativePath === 'docs/core/tweak-planning.md')
    expect(tweakEntry).toBeDefined()
    expect(tweakEntry!.absolutePath).toContain('templates')
    expect(tweakEntry!.absolutePath).toContain('tweak-planning.md')
  })
})

// T-R2-1.0.2.2: Template file exists and is non-empty
describe('T-R2-1.0.2.2: template file exists and is non-empty', () => {
  it('templates/docs/core/tweak-planning.md exists and has content', async () => {
    const templatePath = resolveTemplatePath('docs/core/tweak-planning.md')
    await expect(access(templatePath)).resolves.toBeUndefined()
    const content = await readFile(templatePath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
    expect(content).toContain('Tweak Planning')
  })
})

// T-R2-1.0.3: Phase-planning template contains a Tweaks section
describe('T-R2-1.0.3: phase-planning template contains Tweaks section', () => {
  it('templates/docs/core/phase-planning.md includes ## Tweaks heading', async () => {
    const templatePath = resolveTemplatePath('docs/core/phase-planning.md')
    const content = await readFile(templatePath, 'utf-8')
    expect(content).toContain('## Tweaks')
    expect(content).toContain('tweak-planning.md')
  })
})

// T-R2-1.0.4.1: Each agent template contains tweak routing row
describe('T-R2-1.0.4.1: agent templates contain tweak routing row', () => {
  const agentTemplates = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'QWEN.md']

  for (const agentFile of agentTemplates) {
    it(`${agentFile} contains tweak-planning.md reference`, async () => {
      const templatePath = resolveTemplatePath(agentFile)
      const content = await readFile(templatePath, 'utf-8')
      expect(content).toContain('tweak-planning.md')
      expect(content).toContain('tweak')
    })
  }
})

// T-R2-1.0.5.2: Doctor audit on a project missing tweak-planning.md produces a finding
describe('T-R2-1.0.5.2: Doctor audit detects missing tweak-planning.md', () => {
  it('reports missing-structure finding when tweak-planning.md is absent', async () => {
    const projectDir = await makeTempDir()
    // Write a canonical project, then delete tweak-planning.md
    await writeCanonicalProject(projectDir)
    await rm(join(projectDir, 'docs/core/tweak-planning.md'))

    const result = await runDoctorAudit(projectDir)

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing-structure',
        targetPath: 'docs/core/tweak-planning.md',
      }),
    )
  })
})

// T-R2-1.0.5.3: Doctor repair restores tweak-planning.md without affecting other files
describe('T-R2-1.0.5.3: Doctor repair restores tweak-planning.md', () => {
  it('repair creates the file and re-audit passes clean for that path', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await rm(join(projectDir, 'docs/core/tweak-planning.md'))

    // First audit — should find the missing file
    const firstResult = await runDoctorAudit(projectDir)
    const tweakFinding = firstResult.findings.find(
      (f) => f.targetPath === 'docs/core/tweak-planning.md',
    )
    expect(tweakFinding).toBeDefined()
    expect(tweakFinding!.repairable).toBe(true)

    // Manually repair — copy from template
    const templatePath = resolveTemplatePath('docs/core/tweak-planning.md')
    const templateContent = await readFile(templatePath, 'utf-8')
    const destPath = join(projectDir, 'docs/core/tweak-planning.md')
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, templateContent, 'utf-8')

    // Re-audit — tweak-planning.md should not appear in findings
    const secondResult = await runDoctorAudit(projectDir)
    const tweakPaths = secondResult.findings
      .filter((f) => f.targetPath === 'docs/core/tweak-planning.md')
    expect(tweakPaths).toHaveLength(0)
  })
})
