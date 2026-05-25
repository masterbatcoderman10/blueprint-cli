import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT_DIR = resolve(__dirname, '../../../')
const ALIGNMENT_PATH = join(ROOT_DIR, 'docs', 'core', 'alignment.md')
const TEMPLATES_ALIGNMENT_PATH = join(ROOT_DIR, 'templates', 'docs', 'core', 'alignment.md')
const SNIPPET_PATH = join(ROOT_DIR, 'templates', 'skill', '_project-conventions.snippet.md')

const SKILL_TEMPLATE_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

function bodyAfterFirstLine(content: string): string {
  const lineFeed = content.indexOf('\n')
  return lineFeed === -1 ? '' : content.slice(lineFeed + 1)
}

function normalizeConventionBlock(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n')
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`
}

function extractProjectConventionsBlock(content: string): string {
  const start = content.indexOf('<ProjectConventions>')
  const end = content.indexOf('</ProjectConventions>')

  if (start === -1 || end === -1) {
    return ''
  }

  return normalizeConventionBlock(content.slice(start, end + '</ProjectConventions>'.length))
}

function readTemplateBodies(root = ROOT_DIR): string[] {
  return SKILL_TEMPLATE_FILES.map((fileName) => bodyAfterFirstLine(readFileSync(join(root, 'templates', 'skill', fileName), 'utf-8')))
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
    expect(alignment).toContain('selected project entry-point file')
    expect(alignment).toContain('<ProjectConventions>')
    expect(alignment).toContain('Do NOT write the ProjectConventions section')
    expect(alignment).toContain('without explicit user approval')
  })

  it('T-R11-3.C.1.2: user-approval guidance still applies to entry-point editing', () => {
    const alignment = readFileSync(ALIGNMENT_PATH, 'utf-8')

    expect(alignment).toContain('Anti-Patterns')
    expect(alignment).toContain('<BadExample>The agent finishes analysis, writes the ProjectConventions section to disk')
    expect(alignment).toContain('and only afterward asks whether the user approves the current stage.')
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
  it('T-R11-3.C.3.1: skill-mode templates include canonical snippet and stay byte-identical below title', () => {
    const snippet = readFileSync(SNIPPET_PATH, 'utf-8')
    const skillTemplateBodies = readTemplateBodies()

    for (const [index, body] of skillTemplateBodies.entries()) {
      const extracted = extractProjectConventionsBlock(body)
      expect(extracted, `templates/skill/${SKILL_TEMPLATE_FILES[index]}`).toBe(snippet)
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
