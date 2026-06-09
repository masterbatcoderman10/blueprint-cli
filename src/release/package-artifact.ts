import { execSync } from 'child_process'

import { getPackagedSkillPayloadPaths } from './skill-payload-inventory'

interface PackFileEntry {
  path: string
}

interface PackResult {
  files?: PackFileEntry[]
}

function hasPublishedPath(files: PackFileEntry[], prefix: string): boolean {
  return files.some((entry) => entry.path === prefix || entry.path.startsWith(`${prefix}/`))
}

function hasPublishedFile(files: PackFileEntry[], path: string): boolean {
  return files.some((entry) => entry.path === path)
}

export function getRequiredSkillPackagePaths(): string[] {
  return getPackagedSkillPayloadPaths()
}

export function verifyPackageArtifactFiles(files: PackFileEntry[]): void {
  if (!hasPublishedPath(files, 'dist')) {
    throw new Error('Packed artifact is missing compiled dist output.')
  }

  if (!hasPublishedPath(files, 'templates')) {
    throw new Error('Packed artifact is missing bundled templates.')
  }

  const missingSkillPaths = getRequiredSkillPackagePaths().filter(
    (path) => !hasPublishedFile(files, path),
  )

  if (missingSkillPaths.length > 0) {
    throw new Error(
      `Packed artifact is missing repo-root skill payload files: ${missingSkillPaths.join(', ')}`,
    )
  }
}

export function verifyPackageArtifact(): void {
  const raw = execSync('npm pack --json --dry-run', {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  const results = JSON.parse(raw) as PackResult[]
  const files = Array.isArray(results) && results[0]?.files ? results[0].files : []
  verifyPackageArtifactFiles(files)
}
