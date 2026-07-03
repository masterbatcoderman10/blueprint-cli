import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join, resolve } from 'node:path'
import { mkdtemp, rm, readFile, readdir, stat, existsSync, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { copyFileSafe } from '../../../src/init/fs-utils'
import {
  scaffoldBlueprintDirectory,
  generateAgentFiles,
  copyCoreTemplates,
  copySkillPayload,
  copySkillModeAgentStubs,
  executeScaffold,
} from '../../../src/init/archive-engine'
import type { InitOptions, Mode } from '../../../src/init/types'

const TEMPLATES_DIR = join(__dirname, '../../../templates')
const EXPECTED_SKILL_INSTALL_BASES = ['.claude/skills/blueprint', '.agents/skills/blueprint'] as const
const EXPECTED_SKILL_STUB = `This project uses the Blueprint development system.

Invoke the \`blueprint\` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.
`

function makeInitOptions(overrides: Partial<InitOptions> = {}): InitOptions {
  return {
    projectName: 'test-project',
    projectTagline: 'Test project tagline',
    mode: 'skill' as Mode,
    git: {
      hasExistingRepository: false,
      shouldInitialize: false,
      shouldSetMainBranch: false,
    },
    docs: {
      hasExistingDocsDirectory: false,
      shouldArchiveExistingDocs: false,
      archiveDirectoryName: 'docs-archived',
    },
    markdownMigration: {
      discoveredMarkdownPaths: [],
      transferMode: 'skip' as const,
      selectedPaths: [],
    },
    agents: {
      selected: ['CLAUDE.md', 'AGENTS.md'],
      detectedExisting: [],
      shouldArchiveExistingAgentFiles: false,
      ensureClaudeEntryPoint: true,
    },
    confirmation: {
      confirmed: true,
    },
    ...overrides,
  }
}

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'blueprint-stream-d-'))
}

async function cleanupDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isDirectory()
  } catch {
    return false
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isFile()
  } catch {
    return false
  }
}

async function recursiveRead(dir: string, base: string = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await recursiveRead(join(dir, entry.name), rel))
    } else {
      files.push(rel)
    }
  }
  return files.sort()
}

describe('T-R11-1.D.2 — Scaffold engine branched on Mode', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupDir(tmpDir)
  })

  describe('T-R11-1.D.2.1: skill mode scaffold', () => {
    it('produces .claude and .agents skill payloads with SKILL.md, references, and scripts', async () => {
      const options = makeInitOptions({ mode: 'skill' })

      await copySkillPayload(tmpDir, options)

      for (const skillBase of EXPECTED_SKILL_INSTALL_BASES) {
        expect(await fileExists(join(tmpDir, skillBase, 'SKILL.md'))).toBe(true)
        expect(await fileExists(join(tmpDir, skillBase, 'reference', 'anti-patterns.md'))).toBe(true)
        expect(await fileExists(join(tmpDir, skillBase, 'scripts', 'load-context.mjs'))).toBe(true)
      }
    })

    it('produces skill-mode agent entry-point stubs from templates/skill/', async () => {
      const options = makeInitOptions({
        mode: 'skill',
        agents: {
          selected: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'],
          detectedExisting: [],
          shouldArchiveExistingAgentFiles: false,
          ensureClaudeEntryPoint: true,
        },
      })

      await copySkillModeAgentStubs(tmpDir, options)

      // Each selected agent file should exist at project root
      for (const agentFile of options.agents.selected) {
        const scaffoldedPath = join(tmpDir, agentFile)
        expect(await fileExists(scaffoldedPath)).toBe(true)

        const content = await readFile(scaffoldedPath, 'utf-8')
        expect(content).toBe(EXPECTED_SKILL_STUB)
        expect(content).not.toContain('<ProjectConventions>')
        expect(content).not.toContain('blueprint-agentic-development')
      }
    })

    it('does not emit docs/core/** in skill mode scaffold', async () => {
      const options = makeInitOptions({ mode: 'skill' })

      await scaffoldBlueprintDirectory(tmpDir, options)

      // docs/core should not exist in skill mode
      expect(await dirExists(join(tmpDir, 'docs', 'core'))).toBe(false)
    })

    it('reports both supported skill install directories in skill mode', async () => {
      const options = makeInitOptions({ mode: 'skill' })

      const result = await executeScaffold(tmpDir, options)

      expect(result.createdDirectories).toEqual(
        expect.arrayContaining([
          'docs/',
          'docs/knowledge-base/',
          'docs/milestones/',
          'docs/tweaks/',
          '.claude/skills/blueprint/',
          '.agents/skills/blueprint/',
        ]),
      )
    })
  })

  describe('T-R11-1.D.2.2: legacy mode is byte-identical to pre-R11', () => {
    it('copies templates/docs/core/** and top-level agent templates unchanged', async () => {
      const options = makeInitOptions({ mode: 'legacy' })

      await scaffoldBlueprintDirectory(tmpDir, options)
      await generateAgentFiles(tmpDir, options)

      // docs/core should exist in legacy mode
      expect(await dirExists(join(tmpDir, 'docs', 'core'))).toBe(true)

      // Check that core template files exist
      const templateCoreDir = join(TEMPLATES_DIR, 'docs', 'core')
      const templateCoreFiles = await readdir(templateCoreDir)

      for (const fileName of templateCoreFiles) {
        if (fileName.endsWith('.md')) {
          const scaffoldedPath = join(tmpDir, 'docs', 'core', fileName)
          expect(await fileExists(scaffoldedPath)).toBe(true)

          // Byte-identical content
          const templateContent = await readFile(join(templateCoreDir, fileName), 'utf-8')
          const scaffoldedContent = await readFile(scaffoldedPath, 'utf-8')
          expect(scaffoldedContent).toBe(templateContent)
        }
      }

      // Agent files should be byte-identical to top-level templates
      for (const agentFile of options.agents.selected) {
        const templatePath = join(TEMPLATES_DIR, agentFile)
        const scaffoldedPath = join(tmpDir, agentFile)

        if (await fileExists(templatePath)) {
          const templateContent = await readFile(templatePath, 'utf-8')
          const scaffoldedContent = await readFile(scaffoldedPath, 'utf-8')
          expect(scaffoldedContent).toBe(templateContent)
        }
      }
    })

    it('does not emit .claude/skills/ in legacy mode', async () => {
      const options = makeInitOptions({ mode: 'legacy' })

      await scaffoldBlueprintDirectory(tmpDir, options)
      await generateAgentFiles(tmpDir, options)

      expect(await dirExists(join(tmpDir, '.claude'))).toBe(false)
    })
  })

  describe('T-R11-1.D.2.3: no path collisions between templates/skill/ and existing template resolution', () => {
    it('templates/skill/ directory does not interfere with top-level template agent files', async () => {
      // templates/skill/CLAUDE.md should be different from templates/CLAUDE.md
      const topClaude = join(TEMPLATES_DIR, 'CLAUDE.md')
      const skillClaude = join(TEMPLATES_DIR, 'skill', 'CLAUDE.md')

      if (await fileExists(skillClaude)) {
        const topContent = await readFile(topClaude, 'utf-8')
        const skillContent = await readFile(skillClaude, 'utf-8')
        // They should be different (skill mode stubs are minimal)
        expect(skillContent).not.toBe(topContent)
      }
    })

    it('scaffold engine resolves correct template roots per mode without mixing', async () => {
      // Skill mode should use templates/skill/ for agent files
      // Legacy mode should use top-level templates/ for agent files
      const skillOptions = makeInitOptions({ mode: 'skill' })
      const legacyOptions = makeInitOptions({ mode: 'legacy' })

      const skillTmp = await createTempDir()
      const legacyTmp = await createTempDir()

      try {
        await scaffoldBlueprintDirectory(skillTmp, skillOptions)
        await generateAgentFiles(skillTmp, skillOptions)

        await scaffoldBlueprintDirectory(legacyTmp, legacyOptions)
        await generateAgentFiles(legacyTmp, legacyOptions)

        // In skill mode, CLAUDE.md should be the skill stub (minimal)
        // In legacy mode, CLAUDE.md should be the full template
        if (await fileExists(join(skillTmp, 'CLAUDE.md')) && await fileExists(join(legacyTmp, 'CLAUDE.md'))) {
          const skillContent = await readFile(join(skillTmp, 'CLAUDE.md'), 'utf-8')
          const legacyContent = await readFile(join(legacyTmp, 'CLAUDE.md'), 'utf-8')
          // They should differ (skill mode stub is minimal)
          expect(skillContent).not.toBe(legacyContent)
        }
      } finally {
        await cleanupDir(skillTmp)
        await cleanupDir(legacyTmp)
      }
    })
  })

  describe('T-R11-1.D.2.4: parameterized over agent surfaces', () => {
    const agentSurfaces: Array<[string, string[]]> = [
      ['Claude only', ['CLAUDE.md']],
      ['Claude + AGENTS', ['CLAUDE.md', 'AGENTS.md']],
      ['All four', ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']],
    ]

    for (const [label, selected] of agentSurfaces) {
      it(`skill mode: ${label} emits correct stubs`, async () => {
        const options = makeInitOptions({
          mode: 'skill',
          agents: {
            selected: selected as InitOptions['agents']['selected'],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
        })

        await copySkillModeAgentStubs(tmpDir, options)

        for (const agentFile of selected) {
          expect(await fileExists(join(tmpDir, agentFile))).toBe(true)
        }

        // Non-selected agent files should NOT exist
        const allAgents = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']
        for (const agentFile of allAgents) {
          if (!selected.includes(agentFile)) {
            expect(await fileExists(join(tmpDir, agentFile))).toBe(false)
          }
        }
      })
    }
  })
})
