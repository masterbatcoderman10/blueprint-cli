import { isReleaseTag } from './contract'

export interface PublishPreflightInput {
  releaseTag?: string
  environment: Record<string, string | undefined>
  packageJson: {
    name?: string
    publishConfig?: {
      access?: string
    }
  }
}

export interface PublishPreflightResult {
  shouldPublish: boolean
  errors: string[]
}

export function validatePublishPrerequisites(input: PublishPreflightInput): PublishPreflightResult {
  const shouldPublish = typeof input.releaseTag === 'string' && isReleaseTag(input.releaseTag)

  if (!shouldPublish) {
    return { shouldPublish: false, errors: [] }
  }

  const errors: string[] = []

  if (input.packageJson.publishConfig?.access !== 'public') {
    errors.push('Scoped public release requires package.json publishConfig.access to be set to "public".')
  }

  if (!input.environment.GITHUB_REPOSITORY) {
    errors.push('Release publishing requires GITHUB_REPOSITORY so the workflow can identify the source repository.')
  }

  if (!input.environment.ACTIONS_ID_TOKEN_REQUEST_URL && !input.environment.NPM_TOKEN) {
    errors.push(
      'Release publishing requires either GitHub trusted publishing (ACTIONS_ID_TOKEN_REQUEST_URL) or an NPM_TOKEN.',
    )
  }

  return { shouldPublish: true, errors }
}
