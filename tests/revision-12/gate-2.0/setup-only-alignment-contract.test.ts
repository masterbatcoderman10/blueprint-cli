import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '../../..')
const LEGACY_ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const TEMPLATE_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md')
const SKILL_TEMPLATE_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'skills', 'blueprint', 'reference', 'align.md')
const SKILL_ROOT_ALIGNMENT_PATH = join(ROOT_DIR, 'skills', 'blueprint', 'reference', 'align.md')

function read(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '')
}

function frontmatterDescription(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\ndescription:\s*(.+)\n---\n/)

  return match?.[1] ?? ''
}

describe('R12-2.0 setup-only alignment contract', () => {
  it('T-R12-2.0.1.1: rewrites legacy Alignment as a setup-only workflow and removes downstream document production', () => {
    const content = read(LEGACY_ALIGNMENT_PATH)

    expect(content).toContain('Alignment is setup-only')
    expect(content).toContain('The goal is only enough context to draft:')
    expect(content).toContain('Draft only the approved setup blocks:')
    expect(content).toContain('<ProjectConventions>')
    expect(content).toContain('<AgentOrchestration>')
    expect(content).toMatch(/write only the approved\s+<ProjectConventions> and <AgentOrchestration> blocks/)
    expect(content).not.toContain('<DocumentProduction>')
    expect(content).not.toContain('docs/prd.md — Stage 1 (body only)')
    expect(content).not.toContain('docs/srs.md')
    expect(content).not.toContain('First milestone document')
    expect(content).not.toContain('6. docs/project-progress.md')
    expect(content).not.toContain('SRS POPULATION LEADS:')
  })

  it('T-R12-2.0.1.2: keeps approval-before-write discipline and stops at the fresh-session handoff', () => {
    const content = read(LEGACY_ALIGNMENT_PATH)
    const approvalIndex = content.indexOf('Do NOT write approved setup blocks without explicit user approval.')
    const completionIndex = content.indexOf('run `blueprint alignment-complete`')
    const handoffIndex = content.indexOf('start a fresh session or clear context before Foundation Planning')

    expect(approvalIndex).toBeGreaterThan(-1)
    expect(completionIndex).toBeGreaterThan(approvalIndex)
    expect(handoffIndex).toBeGreaterThan(completionIndex)
    expect(content).toContain('Do NOT continue into Foundation Planning from Alignment.')
  })

  it('T-R12-2.0.2.1: keeps templates/docs/core/alignment.md byte-identical to docs/core/alignment.md', () => {
    expect(read(TEMPLATE_ALIGNMENT_PATH)).toBe(read(LEGACY_ALIGNMENT_PATH))
  })

  it('T-R12-2.0.3.1: rewrites the skill align reference around the setup-only contract', () => {
    const content = read(SKILL_TEMPLATE_ALIGNMENT_PATH)
    const description = frontmatterDescription(content)

    expect(content).toContain('setup-only Alignment')
    expect(content).toContain('routes alignment intent when project-progress.md is empty')
    expect(description).toContain('supported-root setup repair')
    expect(content).toContain('<ProjectConventions>')
    expect(content).toContain('<AgentOrchestration>')
    expect(stripFrontmatter(content)).toBe(read(LEGACY_ALIGNMENT_PATH))
    expect(content).not.toContain('producing foundational documents')
    expect(content).not.toContain('<DocumentProduction>')
    expect(content).not.toContain('docs/prd.md — Stage 1 (body only)')
  })

  it('T-R12-2.0.3.2: keeps Foundation Planning skill-only with no new legacy/core surface', () => {
    expect(existsSync(join(ROOT_DIR, 'docs', 'core', 'foundation-planning.md'))).toBe(false)
    expect(existsSync(join(ROOT_DIR, 'templates', 'docs', 'core', 'foundation-planning.md'))).toBe(false)

    const content = read(SKILL_TEMPLATE_ALIGNMENT_PATH)
    expect(content).not.toContain('docs/core/foundation-planning.md')
    expect(content).not.toContain('templates/docs/core/foundation-planning.md')
  })

  it('T-R12-2.0.4.1: keeps the repo-root skill mirror byte-identical to the template skill reference', () => {
    expect(read(SKILL_ROOT_ALIGNMENT_PATH)).toBe(read(SKILL_TEMPLATE_ALIGNMENT_PATH))
  })
})
