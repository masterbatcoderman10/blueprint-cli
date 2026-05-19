import { readFile, access, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
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

const REPO_ROOT = resolve(__dirname, '..', '..', '..')
const TWEAK_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'tweak-planning.md')
const EXECUTION_PATH = resolve(REPO_ROOT, 'docs', 'core', 'execution.md')
const PHASE_PLANNING_PATH = resolve(REPO_ROOT, 'docs', 'core', 'phase-planning.md')

async function readDoc(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

function extractBlock(content: string, tagName: string): string | null {
  const open = `<${tagName}>`
  const close = `</${tagName}>`
  const start = content.indexOf(open)
  if (start === -1) return null
  const end = content.indexOf(close, start + open.length)
  if (end === -1) return null
  return content.slice(start + open.length, end)
}

// T-R7-1.B.7.3 (structural): CANONICAL_CORE_FILES includes docs/core/tweak-planning.md
describe('T-R7-1.B.7.3: standalone-contract structural rules', () => {
  it('CANONICAL_CORE_FILES includes docs/core/tweak-planning.md', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/tweak-planning.md')
  })

  it('is included in getCanonicalStructurePaths()', () => {
    const paths = getCanonicalStructurePaths()
    expect(paths).toContain('docs/core/tweak-planning.md')
  })

  it('tweak-planning.md is included in resolved core template paths', () => {
    const entries = resolveAllCoreTemplatePaths()
    const tweakEntry = entries.find((e) => e.relativePath === 'docs/core/tweak-planning.md')
    expect(tweakEntry).toBeDefined()
    expect(tweakEntry!.absolutePath).toContain('templates')
    expect(tweakEntry!.absolutePath).toContain('tweak-planning.md')
  })

  it('template file exists and is non-empty', async () => {
    const templatePath = resolveTemplatePath('docs/core/tweak-planning.md')
    await expect(access(templatePath)).resolves.toBeUndefined()
    const content = await readFile(templatePath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
    expect(content).toContain('Tweak Planning')
  })

  it('docs/tweaks/ is the canonical tweak location', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    expect(content).toContain('docs/tweaks/')
    expect(content).toMatch(/tweak-<n>-<slug>\.md/)
  })

  it('live phase-planning.md <PhaseTemplate> contains no ## Tweaks heading', async () => {
    const content = await readDoc('docs/core/phase-planning.md')
    // Only check inside <PhaseTemplate>; <PhaseExample> may still reference it until cleaned.
    const phaseTemplate = extractBlock(content, 'PhaseTemplate')
    expect(phaseTemplate).not.toBeNull()
    expect(phaseTemplate!).not.toContain('## Tweaks')
  })

  it('tweak-planning.md contains <TweakIntentClassification> with proactive classification', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakIntentClassification')
    expect(block, '<TweakIntentClassification> block must be present').not.toBeNull()
    const body = (block ?? '').toLowerCase()
    expect(body).toMatch(/proactive|proactively/)
    expect(body).toMatch(/classif/)
    expect(body).toMatch(/regardless|even (if|when)/)
  })

  it('tweak-planning.md contains <TweakReviewGate> with mandatory confirmation before TO-DO → IN-PROGRESS', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakReviewGate')
    expect(block, '<TweakReviewGate> block must be present').not.toBeNull()
    const body = block ?? ''
    expect(body).toContain('TO-DO')
    expect(body.toLowerCase()).toContain('mandatory')
    expect(body.toLowerCase()).toMatch(/confirm|confirmation/)
  })
})

// T-R7-1.B.7.1 (behavioral): tweak-start gate
describe('T-R7-1.B.7.1: tweak-start gate behavior', () => {
  it('execution.md defines the tweak-start gate blocking TO-DO → IN-PROGRESS without explicit user confirmation', async () => {
    const content = await readDoc(EXECUTION_PATH)
    const lower = content.toLowerCase()
    // Must contain a tweak-start gate clause
    expect(lower).toContain('tweak-start')
    expect(lower).toContain('to-do')
    expect(lower).toContain('in-progress')
    expect(lower).toMatch(/explicit.*confirm|confirm.*explicit/)
  })

  it('tweak-planning.md <TweakReviewGate> blocks execution until user confirms the drafted tweak plan', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakReviewGate')
    expect(block).not.toBeNull()
    const body = (block ?? '').toLowerCase()
    // No task may leave TO-DO until explicit confirmation
    expect(body).toContain('to-do')
    expect(body).toContain('in-progress')
    expect(body).toMatch(/no.*task.*(leave|move|transition)/)
    expect(body).toMatch(/explicit.*confirm|confirmed/)
  })
})

// T-R7-1.B.7.2 (behavioral): tweak-completion gate
describe('T-R7-1.B.7.2: tweak-completion gate behavior', () => {
  it('execution.md defines the tweak-completion gate requiring npm test green before terminal task → DONE', async () => {
    const content = await readDoc(EXECUTION_PATH)
    const lower = content.toLowerCase()
    expect(lower).toContain('tweak-completion')
    expect(lower).toContain('npm test')
    expect(lower).toContain('done')
  })

  it('tweak-planning.md <TweakExecutionLifecycle> enforces npm test green before DONE', async () => {
    const content = await readDoc(TWEAK_PLANNING_PATH)
    const block = extractBlock(content, 'TweakExecutionLifecycle')
    expect(block, '<TweakExecutionLifecycle> block must be present').not.toBeNull()
    const body = (block ?? '').toLowerCase()
    expect(body).toContain('npm test')
    expect(body).toContain('done')
    expect(body).toMatch(/green|pass|exit.*0/)
  })
})

// T-R7-1.B.7.4: repo-wide grep guard against ## Tweaks
describe('T-R7-1.B.7.4: repo-wide guard against reintroducing ## Tweaks', () => {
  it('no post-R7 phase doc under docs/milestones/ reintroduces ## Tweaks as a heading', async () => {
    const { execSync } = await import('node:child_process')
    // Grep for actual headings (line starts with ## Tweaks), not string references.
    const grepResult = execSync(
      'grep -r "^## Tweaks" docs/milestones/ --include="*.md" -l || true',
      { cwd: REPO_ROOT, encoding: 'utf8' },
    )
    const filesWithTweaks = grepResult.trim().split('\n').filter(Boolean)

    // Allowlist: historical pre-R7 phase docs may contain ## Tweaks headings.
    const preR7 = [
      'revision-2',
      'revision-3',
      'revision-4',
      'revision-5',
      'revision-6',
    ]
    const disallowed = filesWithTweaks.filter(
      (f) => !preR7.some((r) => f.includes(r)),
    )

    expect(disallowed).toHaveLength(0)
  })

  it('no template file reintroduces ## Tweaks as a heading', async () => {
    const { execSync } = await import('node:child_process')
    // Grep for actual headings (line starts with ## Tweaks), not indented examples.
    const grepResult = execSync(
      'grep -r "^## Tweaks" templates/ --include="*.md" -l || true',
      { cwd: REPO_ROOT, encoding: 'utf8' },
    )
    const filesWithTweaks = grepResult.trim().split('\n').filter(Boolean)
    expect(filesWithTweaks).toHaveLength(0)
  })
})

// Retained from R2: Doctor audit and repair coverage for tweak-planning.md
describe('T-R7-1.B.7.3 (retained): Doctor audit detects missing tweak-planning.md', () => {
  it('reports missing-structure finding when tweak-planning.md is absent', async () => {
    const projectDir = await makeTempDir()
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

describe('T-R7-1.B.7.3 (retained): Doctor repair restores tweak-planning.md', () => {
  it('repair creates the file and re-audit passes clean for that path', async () => {
    const projectDir = await makeTempDir()
    await writeCanonicalProject(projectDir)
    await rm(join(projectDir, 'docs/core/tweak-planning.md'))

    const firstResult = await runDoctorAudit(projectDir)
    const tweakFinding = firstResult.findings.find(
      (f) => f.targetPath === 'docs/core/tweak-planning.md',
    )
    expect(tweakFinding).toBeDefined()
    expect(tweakFinding!.repairable).toBe(true)

    const templatePath = resolveTemplatePath('docs/core/tweak-planning.md')
    const templateContent = await readFile(templatePath, 'utf-8')
    const destPath = join(projectDir, 'docs/core/tweak-planning.md')
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, templateContent, 'utf-8')

    const secondResult = await runDoctorAudit(projectDir)
    const tweakPaths = secondResult.findings
      .filter((f) => f.targetPath === 'docs/core/tweak-planning.md')
    expect(tweakPaths).toHaveLength(0)
  })
})

// Retained from R2: live root agent files contain tweak routing
describe('T-R7-1.B.7.3 (retained): live root agent files contain tweak routing row', () => {
  const liveAgentFiles = ['AGENTS.md', 'GEMINI.md', 'QWEN.md', 'CLAUDE.md']

  for (const agentFile of liveAgentFiles) {
    it(`${agentFile} at project root contains tweak-planning.md reference`, async () => {
      const filePath = join(REPO_ROOT, agentFile)
      const content = await readFile(filePath, 'utf-8')
      expect(content).toContain('tweak-planning.md')
      expect(content).toContain('tweak')
    })
  }
})
