import { expect, describe, it } from 'vitest'
import { mkdtemp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const ROOT_DIR = resolve(__dirname, '../../..')

const TEMPLATE_LEGACY_ENTRYPOINT_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'GEMINI.md',
  'templates/CLAUDE.md',
  'templates/AGENTS.md',
  'templates/GEMINI.md',
  'templates/QWEN.md',
] as const

const TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES = [
  'templates/CLAUDE.md',
  'templates/AGENTS.md',
  'templates/GEMINI.md',
  'templates/QWEN.md',
] as const

const LEGACY_ENTRYPOINT_SKILL_FILES = [
  'templates/skill/CLAUDE.md',
  'templates/skill/AGENTS.md',
  'templates/skill/GEMINI.md',
  'templates/skill/QWEN.md',
] as const

const EXPECTED_DEPRECATION_NOTE = `<DeprecationNote>
  Legacy mode is deprecated. Consider migrating to skill mode for native Claude Code skill discovery and reduced context overhead. See README install instructions or run \`blueprint migrate\` to convert the project in place.
</DeprecationNote>`

function bodyAfterTitleLine(content: string): string {
  const lineFeed = content.indexOf('\n')
  return lineFeed === -1 ? '' : content.slice(lineFeed + 1)
}

function readBodies(root: string): string[] {
  return TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES.map((file) => {
    return bodyAfterTitleLine(readFileSync(join(root, file), 'utf-8'))
  })
}

function assertLegacyEntryPointBodiesMatch(root: string): void {
  const bodies = readBodies(root)
  const [expected, ...rest] = bodies
  for (const body of rest) {
    expect(body).toBe(expected)
  }
}

describe('T-R11-3.B.1/B.2: legacy entry-point doc-contract', () => {
  it('T-R11-3.B.1.1: remove conventions load while preserving tracker routing flow', () => {
    for (const file of TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES) {
      const content = readFileSync(join(ROOT_DIR, file), 'utf-8')
      expect(content, `${file} should not retain conventions load in SessionStart`).not.toContain('Load docs/conventions.md.')
      expect(content, `${file} should still load docs/core/tracker.md`).toContain('→ Load docs/core/tracker.md')
      expect(content, `${file} should still use ModuleRouting handoff`).toContain('→ GOTO <ModuleRouting>')
    }
  })

  it('T-R11-3.B.2.1: prepend exact deprecation note immediately after title line', () => {
    for (const file of TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES) {
      const content = readFileSync(join(ROOT_DIR, file), 'utf-8')
      const deprecationIndex = content.indexOf('<DeprecationNote>')
      const blueprintIndex = content.indexOf('<Blueprint>')

      expect(deprecationIndex, `${file} should include a deprecation note`).not.toBe(-1)
      expect(blueprintIndex, `${file} should include <Blueprint>`).not.toBe(-1)
      expect(deprecationIndex, `${file} deprecation note should precede <Blueprint>`).toBeLessThan(blueprintIndex)
      expect(content, `${file} should include exact deprecation note text`).toContain(EXPECTED_DEPRECATION_NOTE)
    }
  })

  it('T-R11-3.B.2.2: all legacy entry-point bodies below title should be byte-identical', () => {
    const bodies = readBodies(ROOT_DIR)
    const [expected, ...rest] = bodies
    for (const body of rest) {
      expect(body).toBe(expected)
    }
  })
})

describe('T-R11-3.B.3 — Legacy block-identity scope', () => {
  it('T-R11-3.B.3.1: legacy identity set excludes skill-mode files', () => {
    const legacyIdentityScope = [
      ...TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES,
      'CLAUDE.md',
      'AGENTS.md',
      'GEMINI.md',
    ]

    expect(legacyIdentityScope).toHaveLength(7)
    for (const file of LEGACY_ENTRYPOINT_SKILL_FILES) {
      expect(legacyIdentityScope.includes(file)).toBe(false)
    }
    expect(legacyIdentityScope).toContain('CLAUDE.md')
    expect(legacyIdentityScope).toContain('AGENTS.md')
    expect(legacyIdentityScope).toContain('GEMINI.md')
    expect(legacyIdentityScope).toContain('templates/CLAUDE.md')
    expect(legacyIdentityScope).toContain('templates/AGENTS.md')
    expect(legacyIdentityScope).toContain('templates/GEMINI.md')
    expect(legacyIdentityScope).toContain('templates/QWEN.md')
  })

  it('T-R11-3.B.3.2: mutating a legacy entry-point body fails legacy block-identity check', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'blueprint-r11-3-b3-'))
    try {
      for (const file of TEMPLATE_ONLY_LEGACY_ENTRYPOINT_FILES) {
        const source = join(ROOT_DIR, file)
        const destination = join(tempDir, file)
        const destinationDir = dirname(destination)

        if (!existsSync(destinationDir)) {
          await mkdir(destinationDir, { recursive: true })
        }
        await writeFile(destination, await readFile(source, 'utf-8'), 'utf-8')
      }

      const driftedTemplatePath = join(tempDir, 'templates/CLAUDE.md')
      const driftedContent = await readFile(driftedTemplatePath, 'utf-8')
      await writeFile(driftedTemplatePath, `${driftedContent}\n# drift-marker`, 'utf-8')

      expect(() => assertLegacyEntryPointBodiesMatch(tempDir)).toThrow()
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
