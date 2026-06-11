import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  CROSS_REFERENCE_CATEGORIES,
  LOCAL_SKILL_PAYLOAD_ROOT,
  auditActiveCrossReferences,
  getActiveCrossReferenceFiles,
} from './helpers'

describe('R11-5.D active cross-reference audit', () => {
  it('T-R11-5.D.1.1 rejects active docs/conventions.md guidance while leaving history outside the active audit', async () => {
    await expectNoFindings('deleted-conventions')
  })

  it('T-R11-5.D.1.2 rejects root ModuleRouting as a primary workflow from skill-mode surfaces', async () => {
    await expectNoFindings('legacy-primary-routing')
  })

  it('T-R11-5.D.1.3 keeps public skill install guidance on the Phase 4 npx pathway', async () => {
    await expectNoFindings('conflicting-install-guidance')
  })

  it('T-R11-5.D.1.4 rejects docs/core-only protocol guidance from skill-mode surfaces', async () => {
    await expectNoFindings('docs-core-only-protocols')
  })

  it('T-R11-5.D.2.1 verifies every active-surface stale reference category is empty after fixes', async () => {
    const findings = await auditActiveCrossReferences()

    expect(findings).toEqual([])
  })

  it('T-R11-5.D.2.2 excludes archival milestone history from active cross-reference failures', async () => {
    const fixtureRoot = await createAuditFixture()

    try {
      await mkdir(join(fixtureRoot, 'docs/milestones/revision-11'), { recursive: true })
      await writeFile(
        join(fixtureRoot, 'docs/milestones/revision-11/completed-phase.md'),
        'Historical plan mentioned docs/conventions.md and <ModuleRouting> before skill mode.\n',
        'utf-8',
      )

      await expect(auditActiveCrossReferences(fixtureRoot)).resolves.toEqual([])
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true })
    }
  })

  it(`T-R11-5.D.3.1 includes ${LOCAL_SKILL_PAYLOAD_ROOT}/** through the shared active surface helper`, async () => {
    const activeFiles = await getActiveCrossReferenceFiles()

    expect(activeFiles.some((file) => file.startsWith(`${LOCAL_SKILL_PAYLOAD_ROOT}/`))).toBe(true)
  })

  it.each(CROSS_REFERENCE_CATEGORIES)(
    'T-R11-5.D.3.2 reports %s with an actionable file diagnostic in active fixtures',
    async (category) => {
      const fixtureRoot = await createAuditFixture()

      try {
        const injectedLine = {
          'deleted-conventions': 'Load docs/conventions.md before execution.',
          'legacy-primary-routing': 'Use <ModuleRouting> as the primary workflow.',
          'conflicting-install-guidance': 'Run blueprint install skill for this repository.',
          'docs-core-only-protocols': '- **Blueprint protocol docs** under `docs/core/`',
        }[category]

        await writeFile(join(fixtureRoot, 'CLAUDE.md'), `${injectedLine}\n`, 'utf-8')

        const findings = await auditActiveCrossReferences(fixtureRoot)

        expect(findings).toContainEqual(
          expect.objectContaining({
            category,
            file: 'CLAUDE.md',
            line: 1,
          }),
        )
      } finally {
        await rm(fixtureRoot, { recursive: true, force: true })
      }
    },
  )
})

async function expectNoFindings(category: (typeof CROSS_REFERENCE_CATEGORIES)[number]): Promise<void> {
  const findings = (await auditActiveCrossReferences()).filter((finding) => finding.category === category)

  expect(findings).toEqual([])
}

async function createAuditFixture(): Promise<string> {
  const fixtureRoot = await mkdtempInTmp('blueprint-r11-5-d-')

  await Promise.all([
    mkdir(join(fixtureRoot, 'docs/core'), { recursive: true }),
    mkdir(join(fixtureRoot, 'templates/skill'), { recursive: true }),
    mkdir(join(fixtureRoot, LOCAL_SKILL_PAYLOAD_ROOT), { recursive: true }),
  ])

  await Promise.all([
    writeFile(join(fixtureRoot, 'CLAUDE.md'), 'Invoke the blueprint skill.\n', 'utf-8'),
    writeFile(join(fixtureRoot, 'docs/core/execution.md'), 'Active execution doc.\n', 'utf-8'),
    writeFile(join(fixtureRoot, 'templates/skill/CLAUDE.md'), 'Invoke the blueprint skill.\n', 'utf-8'),
    writeFile(join(fixtureRoot, LOCAL_SKILL_PAYLOAD_ROOT, 'SKILL.md'), 'Use reference modules.\n', 'utf-8'),
  ])

  return fixtureRoot
}

async function mkdtempInTmp(prefix: string): Promise<string> {
  const { mkdtemp } = await import('node:fs/promises')
  return mkdtemp(join(tmpdir(), prefix))
}
