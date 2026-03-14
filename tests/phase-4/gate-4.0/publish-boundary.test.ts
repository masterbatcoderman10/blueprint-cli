import { describe, expect, it } from 'vitest'

import {
  validatePublishPrerequisites,
  type PublishPreflightInput,
} from '../../../src/release/publish-preflight'

function createInput(overrides: Partial<PublishPreflightInput> = {}): PublishPreflightInput {
  return {
    releaseTag: undefined,
    environment: {},
    packageJson: {
      name: '@splitwireml/blueprint',
      publishConfig: { access: 'public' },
    },
    ...overrides,
  }
}

describe('T-4.0.3.1: publish prerequisite failures are actionable', () => {
  it('fails early when release publishing is missing public scope config, auth, or repository context', () => {
    const result = validatePublishPrerequisites(
      createInput({
        releaseTag: 'v0.1.0',
        packageJson: {
          name: '@splitwireml/blueprint',
        },
      }),
    )

    expect(result.shouldPublish).toBe(true)
    expect(result.errors).toContain('Scoped public release requires package.json publishConfig.access to be set to "public".')
    expect(result.errors).toContain('Release publishing requires GITHUB_REPOSITORY so the workflow can identify the source repository.')
    expect(result.errors).toContain(
      'Release publishing requires either GitHub trusted publishing (ACTIONS_ID_TOKEN_REQUEST_URL) or an NPM_TOKEN.',
    )
  })
})

describe('T-4.0.3.2: non-publish validation does not require publish credentials', () => {
  it('skips publish-only prerequisites when the run is not a release-tag publish', () => {
    const result = validatePublishPrerequisites(createInput())

    expect(result.shouldPublish).toBe(false)
    expect(result.errors).toEqual([])
  })
})
