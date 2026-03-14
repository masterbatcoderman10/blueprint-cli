import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const packageJsonPath = resolve(root, 'package.json')
const releaseContractPath = resolve(root, 'docs/release-contract.md')
const maintainerDocPath = resolve(root, 'docs/releasing.md')

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>
}

describe('T-C.3.1: maintainer release docs cover publish prerequisites and recovery guidance', () => {
  it('documents scope setup, release tags, auth requirements, and failure handling', () => {
    const releaseDoc = readFileSync(maintainerDocPath, 'utf-8')

    expect(releaseDoc).toContain('@splitwireml/blueprint')
    expect(releaseDoc).toContain('splitwireml')
    expect(releaseDoc).toContain('vMAJOR.MINOR.PATCH')
    expect(releaseDoc).toContain('ACTIONS_ID_TOKEN_REQUEST_URL')
    expect(releaseDoc).toContain('NPM_TOKEN')
    expect(releaseDoc).toContain('GITHUB_REPOSITORY')
    expect(releaseDoc).toContain('publishConfig.access')
    expect(releaseDoc).toContain('npm run release:check')
    expect(releaseDoc).toContain('npm run release:publish:preflight')
    expect(releaseDoc).toContain('If publish prerequisites are missing')
  })
})

describe('T-C.3.2: maintainer release docs stay aligned with the implemented release contract', () => {
  it('matches the current package name and release-check entrypoints', () => {
    const packageJson = readPackageJson()
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')
    const releaseDoc = readFileSync(maintainerDocPath, 'utf-8')

    expect(releaseDoc).toContain(String(packageJson.name))
    expect(releaseDoc).toContain(String((packageJson.scripts as Record<string, string>)['release:check']))
    expect(releaseDoc).toContain(String((packageJson.scripts as Record<string, string>)['release:publish:preflight']))
    expect(releaseDoc).toContain('npm run release:check:ci')
    expect(releaseDoc).toContain('npm run release:check:publish')
    expect(releaseDoc).toContain('public')

    expect(releaseContract).toContain('vMAJOR.MINOR.PATCH')
    expect(releaseDoc).toContain('vMAJOR.MINOR.PATCH')
  })
})
