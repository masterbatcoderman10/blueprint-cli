import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

interface PackageJson {
  bin?: Record<string, string>
  files?: string[]
}

const packageJsonPath = resolve(process.cwd(), 'package.json')

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson
}

describe('R11-4.B.1 package surface', () => {
  it('includes the repo-root skills payload alongside dist and templates', () => {
    const packageJson = readPackageJson()

    expect(packageJson.files).toEqual(
      expect.arrayContaining(['dist', 'dist/spa', 'templates', 'skills']),
    )
  })

  it('does not add a fallback-installer bin entry', () => {
    const packageJson = readPackageJson()

    expect(packageJson.bin).toEqual({
      blueprint: './dist/index.js',
    })
    expect(packageJson.bin).not.toHaveProperty('blueprint-skill-install')
  })
})
