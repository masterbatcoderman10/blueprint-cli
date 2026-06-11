import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const DOGFOOD_TWEAK_PATH = resolve(REPO_ROOT, 'docs/tweaks/tweak-6-skill-mode-tweak-example.md')

const DOGFOOD_TWEAK_SURFACES = [
  'docs/core/tweak-planning.md',
  'templates/docs/core/tweak-planning.md',
  'templates/skills/blueprint/reference/tweak.md',
  'skills/blueprint/reference/tweak.md',
  '.claude/skills/blueprint/reference/tweak.md',
] as const

describe('R11-5.C.3 dogfood tweak regression coverage', () => {
  it.each(DOGFOOD_TWEAK_SURFACES)(
    'T-R11-5.C.3.1 keeps %s on the skill-mode ProjectConventions example',
    async (relativePath) => {
      const content = await readFile(resolve(REPO_ROOT, relativePath), 'utf-8')

      expect(content).toContain('<ProjectConventions>')
      expect(content).not.toContain('docs/conventions.md')
      expect(content).not.toContain('conventions.md worked example')
    },
  )

  it('T-R11-5.C.3.2 declares the owning surface set and keeps required mirrors byte-identical', async () => {
    const record = await readFile(DOGFOOD_TWEAK_PATH, 'utf-8')

    expect(record).toContain('Owning surface set:')
    for (const relativePath of DOGFOOD_TWEAK_SURFACES) {
      expect(record).toContain(`\`${relativePath}\``)
    }

    await expect(readFile(resolve(REPO_ROOT, 'templates/docs/core/tweak-planning.md'), 'utf-8')).resolves.toBe(
      await readFile(resolve(REPO_ROOT, 'docs/core/tweak-planning.md'), 'utf-8'),
    )

    const skillTemplate = await readFile(
      resolve(REPO_ROOT, 'templates/skills/blueprint/reference/tweak.md'),
      'utf-8',
    )
    await expect(readFile(resolve(REPO_ROOT, 'skills/blueprint/reference/tweak.md'), 'utf-8')).resolves.toBe(
      skillTemplate,
    )
    await expect(readFile(resolve(REPO_ROOT, '.claude/skills/blueprint/reference/tweak.md'), 'utf-8')).resolves.toBe(
      skillTemplate,
    )
  })
})
