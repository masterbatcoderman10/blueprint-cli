import { execSync } from 'child_process'

export interface VersionCheckResult {
  exists: boolean
  error?: string
}

export async function checkVersionExists(
  packageName: string,
  version: string,
): Promise<VersionCheckResult> {
  try {
    execSync(`npm view ${packageName}@${version} version`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    return { exists: true }
  } catch {
    return { exists: false }
  }
}
