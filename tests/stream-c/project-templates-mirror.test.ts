import { readFile, readdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..')
const TEMPLATES_DIR = join(ROOT_DIR, 'templates')
const DOCS_DIR = join(ROOT_DIR, 'docs')

/**
 * Recursively collect all file paths under a directory.
 */
async function collectFiles(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relativePath = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await collectFiles(join(dir, entry.name), relativePath))
    } else {
      files.push(relativePath)
    }
  }
  return files
}

describe('R6-3.C: Project + Templates Mirror', () => {
  describe('C.1-C.3: Zero vibe-kanban references in templates/', () => {
    it('has no "vibe-kanban" references anywhere in templates/', async () => {
      const files = await collectFiles(TEMPLATES_DIR)
      for (const relativePath of files) {
        const content = await readFile(join(TEMPLATES_DIR, relativePath), 'utf-8')
        expect(content.toLowerCase(), relativePath).not.toContain('vibe-kanban')
      }
    })

    it('has no "kanban board" references as the work management system in templates/', async () => {
      const files = await collectFiles(TEMPLATES_DIR)
      for (const relativePath of files) {
        const content = await readFile(join(TEMPLATES_DIR, relativePath), 'utf-8')
        expect(content.toLowerCase(), relativePath).not.toContain('kanban board')
      }
    })
  })

  describe('C.3: Tracker field present in project-progress.md files', () => {
    it('docs/project-progress.md has **Tracker**: blueprint-cli', async () => {
      const content = await readFile(join(DOCS_DIR, 'project-progress.md'), 'utf-8')
      expect(content).toContain('**Tracker**: blueprint-cli')
      expect(content).not.toContain('**Kanban**: blueprint-cli')
    })

    it('templates/project-progress.md has **Tracker**: {{project-name}}', async () => {
      const content = await readFile(join(TEMPLATES_DIR, 'project-progress.md'), 'utf-8')
      expect(content).toContain('**Tracker**: {{project-name}}')
      expect(content).not.toContain('## Tracker')
    })
  })

  describe('C.4-C.7: Mirrored files equal source files byte-for-byte', () => {
    const mirrorPairs: { source: string; template: string }[] = [
      // Stream A
      { source: 'docs/core/execution.md', template: 'templates/docs/core/execution.md' },
      { source: 'docs/core/review.md', template: 'templates/docs/core/review.md' },
      { source: 'docs/core/git-execution-workflow.md', template: 'templates/docs/core/git-execution-workflow.md' },
      { source: 'docs/core/git-review-workflow.md', template: 'templates/docs/core/git-review-workflow.md' },
      { source: 'docs/core/phase-completion.md', template: 'templates/docs/core/phase-completion.md' },
      { source: 'docs/core/bug-resolution.md', template: 'templates/docs/core/bug-resolution.md' },
      { source: 'docs/core/orchestrate.md', template: 'templates/docs/core/orchestrate.md' },
      // Stream B
      { source: 'docs/core/alignment.md', template: 'templates/docs/core/alignment.md' },
      { source: 'docs/core/phase-planning.md', template: 'templates/docs/core/phase-planning.md' },
      { source: 'docs/core/tweak-planning.md', template: 'templates/docs/core/tweak-planning.md' },
      { source: 'docs/core/scope-change.md', template: 'templates/docs/core/scope-change.md' },
      { source: 'docs/core/blueprint-structure.md', template: 'templates/docs/core/blueprint-structure.md' },
      { source: 'docs/core/hierarchy.md', template: 'templates/docs/core/hierarchy.md' },
      { source: 'docs/core/revision-planning.md', template: 'templates/docs/core/revision-planning.md' },
      { source: 'docs/core/test-planning.md', template: 'templates/docs/core/test-planning.md' },
      { source: 'docs/core/srs-planning.md', template: 'templates/docs/core/srs-planning.md' },
      // C.6
      { source: 'docs/core/tracker.md', template: 'templates/docs/core/tracker.md' },
    ]

    it.each(mirrorPairs)('$source ↔ $template', ({ source, template }) => {
      const sourcePath = join(ROOT_DIR, source)
      const templatePath = join(ROOT_DIR, template)
      const sourceBuf = readFileSync(sourcePath)
      const templateBuf = readFileSync(templatePath)
      expect(templateBuf.equals(sourceBuf)).toBe(true)
    })
  })

  describe('C.8: All 4 agent entry points have built-in tracker wording', () => {
    const agentFiles = [
      'templates/CLAUDE.md',
      'templates/AGENTS.md',
      'templates/GEMINI.md',
      'templates/QWEN.md',
    ]

    it.each(agentFiles)('%s contains built-in tracker wording', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      expect(content).toContain('work is managed through the built-in')
      expect(content).toContain('task tracker')
      expect(content).toContain('built-in')
      expect(content).not.toContain('kanban board')
    })
  })

  describe('C.4: Legacy template agent routing tables route tweak intent to tweak-planning.md', () => {
    const legacyTemplateAgentFiles = ['templates/AGENTS.md', 'templates/CLAUDE.md', 'templates/GEMINI.md', 'templates/QWEN.md']

    it.each(legacyTemplateAgentFiles)('%s routes tweak intent to docs/core/tweak-planning.md', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      expect(content).toContain('docs/core/tweak-planning.md')
      expect(content).not.toContain('Correct completed tasks')
      expect(content).toContain('Quick change / tweak')
    })

    it.each(legacyTemplateAgentFiles)('%s contains tweak intent classification clause', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      expect(content).toContain('TWEAK INTENT CLASSIFICATION')
      expect(content).toContain('proactively route to tweak planning')
    })
  })

  describe('T-R8-2.B.2: Legacy and skill routing surfaces describe tweak intent in change-first terms', () => {
    const changeFirstFiles = ['templates/CLAUDE.md', 'templates/skills/blueprint/SKILL.md'] as const

    it.each(changeFirstFiles)('%s describes tweak intent using Tweak Mode and change-first loop language', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      expect(content).toContain('Tweak Mode')
      expect(content).toContain('change-first')
    })

    it.each(changeFirstFiles)('%s contains no pre-task board-planning language for tweak intent', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      // "pre-task board planning" language that implied tracker/board tasks before the change-first workflow
      expect(content).not.toContain('pre-task board planning')
      expect(content).not.toContain('board task')
    })
  })

  describe('C.5: Legacy template agent files share one routing region byte-for-byte', () => {
    const legacyTemplateFiles = ['templates/AGENTS.md', 'templates/CLAUDE.md', 'templates/GEMINI.md', 'templates/QWEN.md'] as const

    function extractRoutingRegion(content: string): string {
      const start = content.indexOf('<ModuleRouting>')
      const end = content.indexOf('</ModuleRouting>') + '</ModuleRouting>'.length
      if (start === -1 || end === -1) return ''
      return content.slice(start, end)
    }

    it('all legacy template routing regions match exactly', () => {
      const routings = legacyTemplateFiles.map((file) => extractRoutingRegion(readFileSync(join(ROOT_DIR, file), 'utf-8')))
      const [expected, ...rest] = routings

      expect(expected).not.toBe('')
      for (const routing of rest) {
        expect(routing).toBe(expected)
      }
    })
  })
})
