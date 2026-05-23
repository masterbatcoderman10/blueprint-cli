import { describe, expect, it } from 'vitest'

import {
  CANONICAL_CORE_FILES,
  getCanonicalStructurePaths,
} from '../../../src/doctor/structure'

describe('T-R5-1.A.2.1: CANONICAL_CORE_FILES includes orchestrate.md', () => {
  it('contains docs/core/orchestrate.md', () => {
    expect(CANONICAL_CORE_FILES).toContain('docs/core/orchestrate.md')
  })
})

describe('T-R5-1.A.2.2: getCanonicalStructurePaths includes orchestrate.md and core count is 20', () => {
  it('exposes orchestrate.md and the core file count is 20', () => {
    const paths = getCanonicalStructurePaths()
    expect(paths).toContain('docs/core/orchestrate.md')
    expect(CANONICAL_CORE_FILES).toHaveLength(20)
  })
})
