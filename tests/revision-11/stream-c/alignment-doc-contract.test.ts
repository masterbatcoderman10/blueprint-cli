import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT_DIR = resolve(__dirname, '../../../')
const ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const TEMPLATES_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md')

const SKILL_TEMPLATE_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

const REQUIRED_SKILL_INTRO = `This project uses the Blueprint development system.

Invoke the \`blueprint\` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.
`
const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'

function readTemplateBodies(root = ROOT_DIR): string[] {
  return SKILL_TEMPLATE_FILES.map((fileName) => readFileSync(join(root, 'templates', 'skill', fileName), 'utf-8'))
}

function assertSkillTemplateBodiesMatch(root = ROOT_DIR): void {
  const bodies = readTemplateBodies(root)
  const [expected, ...rest] = bodies

  for (const body of rest) {
    expect(body).toBe(expected)
  }
}

describe('T-R11-3.C.1: alignment protocol sunsetting conventions.md', () => {
  it('T-R11-3.C.1.1: alignment protocol references <ProjectConventions> and contains zero conventions.md references', () => {
    const alignment = readFileSync(ALIGNMENT_PATH, 'utf-8')

    expect(alignment).not.toContain('conventions.md')
    expect(alignment).toContain('Alignment is setup-only')
    expect(alignment).toContain('<ProjectConventions>')
    expect(alignment).toContain('<AgentOrchestration>')
    expect(alignment).toContain('supported root entry-point files')
    expect(alignment).toContain('Do NOT write approved setup blocks')
    expect(alignment).toContain('without explicit user approval')
  })

  it('T-R11-3.C.1.2: user-approval guidance still applies to entry-point editing', () => {
    const alignment = readFileSync(ALIGNMENT_PATH, 'utf-8')

    expect(alignment).toContain('Anti-Patterns')
    expect(alignment).toContain(
      '<BadExample>The agent writes `<ProjectConventions>` or `<AgentOrchestration>` to disk before the user explicitly approves the current setup draft.</BadExample>',
    )
  })

  it('T-R12-4.C.2.1: alignment guidance treats migrate behavior as current while keeping preservation approval-gated', () => {
    for (const alignment of [readFileSync(ALIGNMENT_PATH, 'utf-8'), readFileSync(TEMPLATES_ALIGNMENT_PATH, 'utf-8')]) {
      expect(alignment).toContain('Do NOT let `migrate` perform smart merge work.')
      expect(alignment).toContain('`blueprint migrate` already forces fresh Alignment and never preserves `alignment-complete`.')
      expect(alignment).toContain('Old-guidance preservation stays with Alignment, with explicit user approval.')
      expect(alignment).not.toContain('Any stricter `migrate` command behavior belongs to Phase 4 and stays out of scope during Alignment.')
    }
  })
})

describe('T-R11-3.C.2: template/documents alignment mirror', () => {
  it('T-R11-3.C.2.1: templates/docs/core/alignment.md matches docs/core/alignment.md', () => {
    const source = readFileSync(ALIGNMENT_PATH, 'utf-8')
    const mirror = readFileSync(TEMPLATES_ALIGNMENT_PATH, 'utf-8')

    expect(mirror).toBe(source)
  })
})

describe('T-R11-3.C.3: skill-mode entry-point block-identity contract', () => {
  it('T-R11-3.C.3.1: skill-mode templates stay placeholder-based and byte-identical', () => {
    const skillTemplateBodies = readTemplateBodies()

    for (const [index, body] of skillTemplateBodies.entries()) {
      expect(body.startsWith(REQUIRED_SKILL_INTRO), `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).toBe(true)
      expect(body, `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).toContain('<ProjectConventions>')
      expect(body, `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).toContain('<AgentOrchestration>')
      expect(body.trimEnd().endsWith(ALIGNMENT_REQUIRED_MARKER), `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).toBe(true)
      expect(body, `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).not.toContain('Node.js >=18.0.0')
      expect(body, `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).not.toContain('/ponytail')
    }

    assertSkillTemplateBodiesMatch()
  })

  it('T-R11-3.C.3.2: mutating a skill template body breaks the block-identity contract', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'blueprint-r11-3-c3-'))

    try {
      for (const fileName of SKILL_TEMPLATE_FILES) {
        const source = join(ROOT_DIR, 'templates', 'skill', fileName)
        const destination = join(tempDir, 'templates', 'skill', fileName)
        const destinationDir = dirname(destination)
        if (!existsSync(destinationDir)) {
          await mkdir(destinationDir, { recursive: true })
        }
        await writeFile(destination, await readFile(source, 'utf-8'), 'utf-8')
      }

      const driftPath = join(tempDir, 'templates', 'skill', SKILL_TEMPLATE_FILES[0])
      await writeFile(driftPath, `${await readFile(driftPath, 'utf-8')}\n# drift-marker`, 'utf-8')

      expect(() => assertSkillTemplateBodiesMatch(tempDir)).toThrow()
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
