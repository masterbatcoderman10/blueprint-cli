import { describe, expect, it } from 'vitest'

import {
  getPackagedSkillPayloadPaths,
} from '../../../src/release/skill-payload-inventory'
import {
  getRequiredSkillPackagePaths,
  verifyPackageArtifactFiles,
} from '../../../src/release/package-artifact'

interface PackFileEntry {
  path: string
}

function createPackEntries(paths: string[]): PackFileEntry[] {
  return paths.map((path) => ({ path }))
}

function createCompleteArtifactEntries(): PackFileEntry[] {
  return createPackEntries([
    'dist/index.js',
    'templates/skills/blueprint/SKILL.md',
    ...getPackagedSkillPayloadPaths(),
  ])
}

describe('R11-4.B.2 release artifact verification', () => {
  it('returns the packaged skill payload paths from the shared inventory', () => {
    expect(getRequiredSkillPackagePaths()).toEqual(getPackagedSkillPayloadPaths())
  })

  it('accepts a packed artifact that includes dist, templates, and the full skill payload', () => {
    expect(() => verifyPackageArtifactFiles(createCompleteArtifactEntries())).not.toThrow()
  })

  it('rejects a packed artifact that omits the entire skills surface', () => {
    expect(() =>
      verifyPackageArtifactFiles(createPackEntries(['dist/index.js', 'templates/skills/blueprint/SKILL.md'])),
    ).toThrowError(/repo-root skill payload files/)
  })

  it.each(getPackagedSkillPayloadPaths())(
    'rejects a packed artifact that omits %s',
    (missingPath) => {
      const files = createCompleteArtifactEntries().filter((entry) => entry.path !== missingPath)

      expect(() => verifyPackageArtifactFiles(files)).toThrowError(
        new RegExp(missingPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      )
    },
  )
})
