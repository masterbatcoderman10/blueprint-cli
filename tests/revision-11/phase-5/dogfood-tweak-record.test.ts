import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const TWEAKS_DIR = resolve(REPO_ROOT, 'docs/tweaks')
const DOGFOOD_TWEAK_PATH = resolve(TWEAKS_DIR, 'tweak-6-skill-mode-tweak-example.md')

describe('R11-5.C.2 dogfood tweak audit record', () => {
  it('T-R11-5.C.2.1 records the completed dogfood tweak loop evidence at the next tweak number', async () => {
    const tweakFiles = (await readdir(TWEAKS_DIR))
      .filter((file) => /^tweak-\d+-.*\.md$/.test(file))
      .sort((left, right) => getTweakNumber(left) - getTweakNumber(right))

    const dogfoodIndex = tweakFiles.indexOf('tweak-6-skill-mode-tweak-example.md')

    expect(dogfoodIndex).toBe(5)
    expect(tweakFiles.slice(0, dogfoodIndex + 1)).toEqual([
      'tweak-1-orchestrator-delegation-discipline.md',
      'tweak-2-tracker-workflow-contract-hardening.md',
      'tweak-3-task-detail-default-open.md',
      'tweak-4-orchestration-bug-and-tweak-scope.md',
      'tweak-5-pre-task-tweak-confirmation-gate.md',
      'tweak-6-skill-mode-tweak-example.md',
    ])
    expect(tweakFiles.slice(0, dogfoodIndex + 1).map(getTweakNumber)).toEqual([1, 2, 3, 4, 5, 6])

    const content = await readFile(DOGFOOD_TWEAK_PATH, 'utf-8')

    expect(content).toContain('## Status')
    expect(content).toContain('Classification: tweak via the installed Blueprint skill workflow')
    expect(content).toContain('User confirmation: the explicit `execute C.2` request')
    expect(content).toContain('Restatement: replace the stale `docs/conventions.md` worked example')
    expect(content).toContain('Selected target: the tweak workflow')
    expect(content).toContain('Changed mirror surfaces: live core doc, template core doc')
    expect(content).toContain('Verification commands/results:')
    expect(content).toContain('User-review outcome:')
    expect(content).toContain('## Files Touched')
    expect(content).toContain('`docs/core/tweak-planning.md`')
    expect(content).toContain('`.claude/skills/blueprint/reference/tweak.md`')
  })

  it('T-R11-5.C.2.2 states skill-mode routing and avoids root ModuleRouting as the workflow source', async () => {
    const content = await readFile(DOGFOOD_TWEAK_PATH, 'utf-8')

    expect(content).toContain('installed skill-mode `tweak` reference')
    expect(content).toContain('not root `<ModuleRouting>`')
    expect(content).not.toContain('routed through root `<ModuleRouting>`')
  })
})

function getTweakNumber(fileName: string): number {
  const match = /^tweak-(\d+)-/.exec(fileName)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}
