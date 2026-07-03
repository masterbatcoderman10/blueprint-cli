import { cp, mkdtemp, mkdir, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SKILL_PAYLOAD_INVENTORY } from '../../../src/release/skill-payload-inventory'

const root = resolve(process.cwd())
const templateRoot = resolve(root, 'templates/skills/blueprint')
const repoRoot = resolve(root, 'skills/blueprint')

async function listRelativeFiles(rootDir: string, currentDir = rootDir): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        return listRelativeFiles(rootDir, entryPath)
      }

      return [relative(rootDir, entryPath)]
    }),
  )

  return files.flat().sort()
}

async function assertSkillPayloadMirror(
  templateDir: string,
  repoDir: string,
): Promise<void> {
  for (const entry of SKILL_PAYLOAD_INVENTORY) {
    const templatePath = resolve(root, entry.templatePath)
    const repoPath = resolve(root, entry.repoRootPath)
      .replace(repoRoot, repoDir)
      .replace(templateRoot, templateDir)
    await expect(readFile(templatePath, 'utf-8')).resolves.toBeDefined()
    await expect(readFile(repoPath, 'utf-8')).resolves.toBeDefined()

    const [templateContent, repoContent] = await Promise.all([
      readFile(templatePath, 'utf-8'),
      readFile(repoPath, 'utf-8'),
    ])
    expect(repoContent).toBe(templateContent)
  }

  const expectedTemplateFiles = SKILL_PAYLOAD_INVENTORY.map((entry) =>
    relative(templateRoot, resolve(root, entry.templatePath)),
  ).sort()
  const expectedRepoFiles = SKILL_PAYLOAD_INVENTORY.map((entry) =>
    relative(repoRoot, resolve(root, entry.repoRootPath)),
  ).sort()

  expect(await listRelativeFiles(templateDir)).toEqual(expectedTemplateFiles)
  expect(await listRelativeFiles(repoDir)).toEqual(expectedRepoFiles)
}

describe('R11-4.A skill payload mirror contract', () => {
  it('T-R11-4.A.1.1/T-R11-4.A.1.2/T-R11-4.A.1.3 materializes the full 23-file repo-root mirror with byte identity and no extra files', async () => {
    await assertSkillPayloadMirror(templateRoot, repoRoot)
  })

  it('keeps setup-gate script instructions relative to the installed skill directory', async () => {
    const skillReadme = await readFile(join(templateRoot, 'SKILL.md'), 'utf-8')

    expect(skillReadme).toContain('node scripts/load-context.mjs')
    expect(skillReadme).not.toContain('.claude/skills/blueprint')
    expect(skillReadme).not.toContain('.agents/skills/blueprint')
  })

  it('T-R11-4.A.2.1/T-R11-4.A.2.2 rejects missing, drifted, and extra files when validating a mirrored payload', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'blueprint-skill-mirror-'))
    const tempTemplateRoot = join(tempDir, 'templates/skills/blueprint')
    const tempRepoRoot = join(tempDir, 'skills/blueprint')

    try {
      await mkdir(join(tempDir, 'templates/skills'), { recursive: true })
      await mkdir(join(tempDir, 'skills'), { recursive: true })
      await cp(templateRoot, tempTemplateRoot, { recursive: true })
      await cp(repoRoot, tempRepoRoot, { recursive: true })

      await unlink(join(tempRepoRoot, 'reference/align.md'))
      await expect(assertSkillPayloadMirror(tempTemplateRoot, tempRepoRoot)).rejects.toThrow()

      await cp(templateRoot, tempTemplateRoot, { recursive: true, force: true })
      await cp(repoRoot, tempRepoRoot, { recursive: true, force: true })
      await writeFile(join(tempRepoRoot, 'reference/align.md'), '# drifted\n', 'utf-8')
      await expect(assertSkillPayloadMirror(tempTemplateRoot, tempRepoRoot)).rejects.toThrow()

      await cp(templateRoot, tempTemplateRoot, { recursive: true, force: true })
      await cp(repoRoot, tempRepoRoot, { recursive: true, force: true })
      await writeFile(join(tempRepoRoot, 'reference/extra.md'), '# extra\n', 'utf-8')
      await expect(assertSkillPayloadMirror(tempTemplateRoot, tempRepoRoot)).rejects.toThrow()
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
