import { readFileSync } from 'fs'
import { resolve } from 'path'

import { validatePublishPrerequisites } from './publish-preflight'

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')) as {
  name?: string
  publishConfig?: {
    access?: string
  }
}

const result = validatePublishPrerequisites({
  releaseTag: process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME,
  environment: process.env,
  packageJson,
})

if (!result.shouldPublish) {
  process.stdout.write('Publish prerequisites not required for this run.\n')
  process.exit(0)
}

if (result.errors.length > 0) {
  process.stderr.write(`${result.errors.join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('Publish prerequisites satisfied.\n')
