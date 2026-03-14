import { execSync } from 'child_process'

interface PackFileEntry {
  path: string
}

interface PackResult {
  files?: PackFileEntry[]
}

function hasPublishedPath(files: PackFileEntry[], prefix: string): boolean {
  return files.some((entry) => entry.path === prefix || entry.path.startsWith(`${prefix}/`))
}

export function verifyPackageArtifact(): void {
  const raw = execSync('npm pack --json --dry-run', {
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  const results = JSON.parse(raw) as PackResult[]
  const files = Array.isArray(results) && results[0]?.files ? results[0].files : []

  if (!hasPublishedPath(files, 'dist')) {
    throw new Error('Packed artifact is missing compiled dist output.')
  }

  if (!hasPublishedPath(files, 'templates')) {
    throw new Error('Packed artifact is missing bundled templates.')
  }
}
