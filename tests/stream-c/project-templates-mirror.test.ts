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

    it('templates/project-progress.md has ## Tracker section', async () => {
      const content = await readFile(join(TEMPLATES_DIR, 'project-progress.md'), 'utf-8')
      expect(content).toContain('## Tracker')
      expect(content).not.toContain('## Kanban')
    })
  })

  describe('C.4-C.7: Mirrored files equal source files byte-for-byte', () => {
    const mirrorPairs: { source: string; template: string }[] = [
      // Stream A
      { source: 'docs/core/execution.md', template: 'templates/docs/core/execution.md' },
      { source: 'docs/core/review.md', template: 'templates/docs/core/review.md' },
      { source: 'docs/core/git-execution-workflow.md', template: 'templates/docs/core/git-execution-workflow.md' },
      { source: 'docs/core/phase-completion.md', template: 'templates/docs/core/phase-completion.md' },
      { source: 'docs/core/bug-resolution.md', template: 'templates/docs/core/bug-resolution.md' },
      { source: 'docs/core/orchestrate.md', template: 'templates/docs/core/orchestrate.md' },
      // Stream B
      { source: 'docs/core/health-check.md', template: 'templates/docs/core/health-check.md' },
      { source: 'docs/core/alignment.md', template: 'templates/docs/core/alignment.md' },
      { source: 'docs/core/phase-planning.md', template: 'templates/docs/core/phase-planning.md' },
      { source: 'docs/core/tweak-planning.md', template: 'templates/docs/core/tweak-planning.md' },
      { source: 'docs/core/scope-change.md', template: 'templates/docs/core/scope-change.md' },
      { source: 'docs/core/blueprint-structure.md', template: 'templates/docs/core/blueprint-structure.md' },
      { source: 'docs/core/srs-planning.md', template: 'templates/docs/core/srs-planning.md' },
      // C.6
      { source: 'docs/core/tracker.md', template: 'templates/docs/core/tracker.md' },
      // C.7
      { source: 'docs/conventions.md', template: 'templates/docs/conventions.md' },
    ]

    it.each(mirrorPairs)('$source ↔ $template', ({ source, template }) => {
      const sourcePath = join(ROOT_DIR, source)
      const templatePath = join(ROOT_DIR, template)
      const sourceBuf = readFileSync(sourcePath)
      const templateBuf = readFileSync(templatePath)
      expect(templateBuf.equals(sourceBuf)).toBe(true)
    })
  })

  describe('C.8: All 4 agent entry points have tracker wording on line 8', () => {
    const agentFiles = [
      'templates/CLAUDE.md',
      'templates/AGENTS.md',
      'templates/GEMINI.md',
      'templates/QWEN.md',
    ]

    it.each(agentFiles)('%s line 8 contains built-in tracker wording', async (file) => {
      const content = await readFile(join(ROOT_DIR, file), 'utf-8')
      const lines = content.split('\n')
      const line8 = lines[7] ?? ''
      expect(line8).toContain('built-in')
      expect(line8).not.toContain('kanban board')
    })
  })
})
