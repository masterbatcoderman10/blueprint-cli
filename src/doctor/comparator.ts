/**
 * Comparison primitives for Blueprint integrity checking.
 *
 * Provides:
 * - compareFileContent: exact content match, missing-file, and drifted-content detection
 * - compareTemplateVersion: version mismatch detection with local recommendation output
 */

import { readFile } from 'node:fs/promises'

export type ContentFindingState =
  | { state: 'clean' }
  | { state: 'missing' }
  | { state: 'drifted'; expected: string; actual: string }

export type VersionCheckResult =
  | { matches: true }
  | { matches: false; projectVersion: string; bundledVersion: string; recommendation: string }

/**
 * Compares the content of a project file against a known template string.
 *
 * Returns:
 *   { state: 'clean' }                         — file exists and matches exactly
 *   { state: 'missing' }                        — file does not exist
 *   { state: 'drifted', expected, actual }      — file exists but content differs
 */
export async function compareFileContent(
  absoluteProjectPath: string,
  templateContent: string,
): Promise<ContentFindingState> {
  let actual: string
  try {
    actual = await readFile(absoluteProjectPath, 'utf-8')
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return { state: 'missing' }
    }
    throw error
  }

  if (actual === templateContent) {
    return { state: 'clean' }
  }

  return { state: 'drifted', expected: templateContent, actual }
}

/**
 * Compares a project manifest's templateVersion against the installed
 * bundled template version constant.
 *
 * Returns:
 *   { matches: true }                                                  — versions are equal
 *   { matches: false, projectVersion, bundledVersion, recommendation } — mismatch detected
 *
 * The recommendation string describes the local action the user can take
 * (re-run `blueprint doctor --repair`) without implying remote fetch or update.
 */
export function compareTemplateVersion(
  projectVersion: string,
  bundledVersion: string,
): VersionCheckResult {
  if (projectVersion === bundledVersion) {
    return { matches: true }
  }

  const recommendation =
    `This project was scaffolded with template version ${projectVersion}, but the installed CLI ` +
    `bundles template version ${bundledVersion}. Run \`blueprint doctor --repair\` to apply the ` +
    `bundled templates and bring the project in sync with the installed CLI.`

  return {
    matches: false,
    projectVersion,
    bundledVersion,
    recommendation,
  }
}
