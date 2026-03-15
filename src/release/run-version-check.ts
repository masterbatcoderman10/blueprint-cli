import { readFileSync } from 'fs'
import { resolve } from 'path'
import { checkVersionExists } from './publish-safeguards'

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'),
) as { name: string; version: string }

async function main(): Promise<void> {
  const { name, version } = packageJson
  process.stdout.write(`Checking if ${name}@${version} already exists on npm...\n`)

  const result = await checkVersionExists(name, version)

  if (result.exists) {
    process.stderr.write(
      `ERROR: ${name}@${version} is already published on npm. ` +
      `Bump the version in package.json before publishing.\n`,
    )
    process.exit(1)
  }

  process.stdout.write(`Version ${version} is available for publishing.\n`)
}

main().catch((err) => {
  process.stderr.write(`Version check failed: ${err}\n`)
  process.exit(1)
})
