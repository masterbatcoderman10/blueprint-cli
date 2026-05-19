import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..')

async function readDoc(relativePath: string): Promise<string> {
  return readFile(resolve(REPO_ROOT, relativePath), 'utf8')
}

describe('T-R7-1.B.1: blueprint-structure.md includes docs/tweaks/', () => {
  it('canonical layout includes docs/tweaks/ directory', async () => {
    const content = await readDoc('docs/core/blueprint-structure.md')
    expect(content).toContain('docs/tweaks/')
  })

  it('"What Goes Where" table includes docs/tweaks/', async () => {
    const content = await readDoc('docs/core/blueprint-structure.md')
    const whatGoesWhereIndex = content.indexOf('## What Goes Where')
    expect(whatGoesWhereIndex).toBeGreaterThan(-1)
    const afterWhatGoesWhere = content.slice(whatGoesWhereIndex)
    expect(afterWhatGoesWhere).toContain('docs/tweaks/')
  })

  it('rules section includes docs/tweaks/', async () => {
    const content = await readDoc('docs/core/blueprint-structure.md')
    const rulesIndex = content.indexOf('## Rules')
    expect(rulesIndex).toBeGreaterThan(-1)
    const afterRules = content.slice(rulesIndex)
    expect(afterRules).toContain('docs/tweaks/')
  })

  it('validation checklist includes docs/tweaks/', async () => {
    const content = await readDoc('docs/core/blueprint-structure.md')
    const validationIndex = content.indexOf('## Validation')
    expect(validationIndex).toBeGreaterThan(-1)
    const afterValidation = content.slice(validationIndex)
    expect(afterValidation).toContain('docs/tweaks/')
  })
})

describe('T-R7-1.B.2: hierarchy.md describes tweaks as top-level quick-change contract', () => {
  it('describes tweaks outside the Project→Milestone→Phase hierarchy', async () => {
    const content = await readDoc('docs/core/hierarchy.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*top-level|top-level.*tweak/)
    expect(lower).toMatch(/outside.*hierarch|hierarch.*outside/)
    expect(lower).toMatch(/quick-change|quick change/)
  })
})

describe('T-R7-1.B.3: scope-change.md and revision-planning.md boundary rules', () => {
  it('scope-change.md routes small contained non-feature changes to tweak planning', async () => {
    const content = await readDoc('docs/core/scope-change.md')
    const lower = content.toLowerCase()
    expect(lower).toContain('tweak')
    expect(lower).toMatch(/small.*contained|contained.*small/)
    expect(lower).toMatch(/non-feature|not a feature/)
    expect(lower).toMatch(/tweak.*planning|tweak-planning/)
  })

  it('revision-planning.md documents the revision/tweak boundary', async () => {
    const content = await readDoc('docs/core/revision-planning.md')
    const lower = content.toLowerCase()
    expect(lower).toContain('tweak')
    // Should mention multi-phase, features, or cross-cutting as revision signals
    expect(lower).toMatch(/multi-phase|cross-cutting|new feature|formal test plan/)
  })
})

describe('T-R7-1.B.4: execution.md, review.md, and phase-completion.md tweak updates', () => {
  it('execution.md allows tweak documents as execution sources', async () => {
    const content = await readDoc('docs/core/execution.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*document|tweak.*plan/)
    expect(lower).toMatch(/execution.*source|source.*execution/)
  })

  it('execution.md defines the tweak-start gate (TO-DO → IN-PROGRESS requires explicit user confirmation)', async () => {
    const content = await readDoc('docs/core/execution.md')
    const lower = content.toLowerCase()
    expect(lower).toContain('tweak-start')
    expect(lower).toContain('to-do')
    expect(lower).toContain('in-progress')
    expect(lower).toMatch(/explicit.*confirm|confirm.*explicit/)
  })

  it('execution.md defines the tweak-completion gate (npm test green before terminal task → DONE)', async () => {
    const content = await readDoc('docs/core/execution.md')
    const lower = content.toLowerCase()
    expect(lower).toContain('tweak-completion')
    expect(lower).toContain('npm test')
    expect(lower).toContain('done')
  })

  it('review.md allows tweak gate/stream review through the existing loop', async () => {
    const content = await readDoc('docs/core/review.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*review|review.*tweak/)
    expect(lower).toMatch(/tweak.*document|tweak.*plan/)
  })

  it('phase-completion.md disclaims ownership of standalone tweak completion', async () => {
    const content = await readDoc('docs/core/phase-completion.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*completion|completion.*tweak/)
    expect(lower).toMatch(/does not own|not own|disclaim/)
    expect(lower).toContain('tweak-planning.md')
  })
})

describe('T-R7-1.B.5: test-planning.md states tweaks do not get a formal test plan', () => {
  it('states tweaks do not get a formal test plan', async () => {
    const content = await readDoc('docs/core/test-planning.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*(do not|does not|no).*(formal )?test plan/)
  })

  it('states needing a formal test plan is an escalation signal', async () => {
    const content = await readDoc('docs/core/test-planning.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/escalation|escalate/)
    expect(lower).toMatch(/revision|milestone/)
  })
})

describe('T-R7-1.B.6: orchestrate.md describes tweak gate/stream map consumption', () => {
  it('describes how orchestration consumes a tweak gate/stream map when present', async () => {
    const content = await readDoc('docs/core/orchestrate.md')
    const lower = content.toLowerCase()
    expect(lower).toMatch(/tweak.*orchestr|orchestr.*tweak/)
    expect(lower).toMatch(/gate.*stream|stream.*gate/)
    expect(lower).toMatch(/execute.*review.*address.*rereview|execute → review → address → rereview/)
  })
})
