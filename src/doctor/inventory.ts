/**
 * Integrity inventory utilities.
 *
 * Provides functions to:
 * - Resolve absolute paths to bundled templates (docs/core/** and root agent files)
 * - Enumerate all canonical template entries for structured iteration
 * - Load the manifest state from a project directory
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { type ManifestState, validateManifest, MANIFEST_RELATIVE_PATH } from './manifest'
import { CANONICAL_CORE_FILES, SUPPORTED_AGENT_FILES } from './structure'

const TEMPLATES_DIR = join(__dirname, '../../templates')

/**
 * Resolves the absolute path to the bundled template for a given
 * project-relative path.
 *
 * Examples:
 *   resolveTemplatePath('docs/core/execution.md')  → <templates>/docs/core/execution.md
 *   resolveTemplatePath('CLAUDE.md')                → <templates>/CLAUDE.md
 */
export function resolveTemplatePath(relativePath: string): string {
  return join(TEMPLATES_DIR, relativePath)
}

/**
 * Returns an entry for every canonical docs/core/** file, each containing
 * the project-relative path and the absolute bundled template path.
 */
export function resolveAllCoreTemplatePaths(): Array<{ relativePath: string; absolutePath: string }> {
  return CANONICAL_CORE_FILES.map((relativePath) => ({
    relativePath,
    absolutePath: resolveTemplatePath(relativePath),
  }))
}

/**
 * Returns an entry for every supported managed root agent file, each
 * containing the file name and the absolute bundled template path.
 */
export function resolveAgentTemplatePaths(): Array<{ fileName: string; absolutePath: string }> {
  return SUPPORTED_AGENT_FILES.map((fileName) => ({
    fileName,
    absolutePath: resolveTemplatePath(fileName),
  }))
}

/**
 * Reads and parses the manifest from a project directory.
 *
 * Returns:
 *   { present: true, data }  — manifest exists and is valid
 *   { present: false }       — manifest file is absent (legacy project, repairable bootstrap)
 *
 * Throws ManifestParseError if the manifest file exists but contains
 * malformed JSON or fails schema validation (distinct from absence).
 */
export async function loadManifestState(projectDir: string): Promise<ManifestState> {
  const manifestPath = join(projectDir, MANIFEST_RELATIVE_PATH)

  let raw: string
  try {
    raw = await readFile(manifestPath, 'utf-8')
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return { present: false }
    }
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ManifestParseError(`Manifest at ${manifestPath} contains invalid JSON`)
  }

  const result = validateManifest(parsed)
  if (!result.valid) {
    throw new ManifestParseError(`Manifest at ${manifestPath} failed schema validation: ${result.error}`)
  }

  return { present: true, data: result.data }
}

export class ManifestParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ManifestParseError'
  }
}
