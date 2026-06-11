import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  FORBIDDEN_ROOT_LEGACY_BLOCKS,
  ROOT_ENTRY_POINT_FILES,
  assertRootEntryPointSkillModeContract,
  extractProjectConventionsBlock,
  getRootEntryPointTemplatePairs,
} from './helpers'

const EXPECTED_SKILL_STUB = `This project uses the Blueprint development system.

Invoke the \`blueprint\` skill at session start and before any planning,
execution, review, tweak, bug, revision, or commit action.

The skill handles routing and workflow guidance for every phase.
`

describe('R11-5.A root entry-point skill-mode contract', () => {
  it('T-R11-5.A.1.1 verifies root entry points are skill-mode files with no legacy routing blocks', async () => {
    await assertRootEntryPointSkillModeContract()
  })

  it('T-R11-5.A.1.2 keeps scaffold templates generic while root entry points keep project conventions', async () => {
    for (const { fileName, rootPath, templatePath } of getRootEntryPointTemplatePairs()) {
      const [rootContent, templateContent] = await Promise.all([
        readFile(rootPath, 'utf-8'),
        readFile(templatePath, 'utf-8'),
      ])

      expect(templateContent, `templates/skill/${fileName}`).toBe(EXPECTED_SKILL_STUB)
      expect(templateContent, `templates/skill/${fileName}`).not.toContain('<ProjectConventions>')
      expect(rootContent, fileName).toContain('<ProjectConventions>')
      expect(rootContent, fileName).not.toBe(templateContent)
    }
  })

  it('T-R11-5.A.1.3 keeps ProjectConventions byte-identical across root files and template snippet', async () => {
    const snippet = await readFile(join(process.cwd(), 'templates/skill/_project-conventions.snippet.md'), 'utf-8')

    for (const { fileName, rootPath } of getRootEntryPointTemplatePairs()) {
      const content = await readFile(rootPath, 'utf-8')
      expect(extractProjectConventionsBlock(content), fileName).toBe(snippet)
    }
  })

  it('T-R11-5.A.2.1 covers all four entry points through the shared Phase 5 helper', () => {
    const coveredFiles = getRootEntryPointTemplatePairs().map((pair) => pair.fileName)

    expect(coveredFiles).toEqual([...ROOT_ENTRY_POINT_FILES])
  })

  it('T-R11-5.A.2.2 fails with an actionable diagnostic for each forbidden legacy block token', async () => {
    const fixtureRoot = await createSkillModeRootFixture()

    try {
      for (const block of FORBIDDEN_ROOT_LEGACY_BLOCKS) {
        await writeFile(join(fixtureRoot, 'AGENTS.md'), `${await createFixtureRootEntryPointContent()}\n${block}\n`, 'utf-8')

        await expect(assertRootEntryPointSkillModeContract(fixtureRoot)).rejects.toThrow(
          `AGENTS.md must not contain legacy routing block ${block}`,
        )
      }
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true })
    }
  })
})

async function createSkillModeRootFixture(): Promise<string> {
  const fixtureRoot = await mkdtempInTmp('blueprint-r11-5-a-')
  await mkdir(join(fixtureRoot, 'templates/skill'), { recursive: true })

  await Promise.all(
    ROOT_ENTRY_POINT_FILES.map(async (fileName) => {
      const sourceContent = await readFile(join(process.cwd(), 'templates/skill', fileName), 'utf-8')
      const rootContent = await createFixtureRootEntryPointContent()

      await Promise.all([
        writeFile(join(fixtureRoot, fileName), rootContent, 'utf-8'),
        writeFile(join(fixtureRoot, 'templates/skill', fileName), sourceContent, 'utf-8'),
      ])
    }),
  )

  await writeFile(
    join(fixtureRoot, 'templates/skill/_project-conventions.snippet.md'),
    await readFile(join(process.cwd(), 'templates/skill/_project-conventions.snippet.md'), 'utf-8'),
    'utf-8',
  )

  return fixtureRoot
}

async function createFixtureRootEntryPointContent(): Promise<string> {
  const snippet = await readFile(join(process.cwd(), 'templates/skill/_project-conventions.snippet.md'), 'utf-8')
  return `${EXPECTED_SKILL_STUB}\n${snippet}`
}

async function mkdtempInTmp(prefix: string): Promise<string> {
  const { mkdtemp } = await import('node:fs/promises')
  return mkdtemp(join(tmpdir(), prefix))
}
