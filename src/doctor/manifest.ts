/**
 * Blueprint manifest schema, validation, and state types.
 *
 * The manifest lives at docs/.blueprint/manifest.json in each Blueprint project.
 * It records the installed template version, CLI version, and which root agent
 * files are managed by Blueprint for that project.
 *
 * Projects created before manifest support are treated as repairable legacy
 * projects (ManifestState with present: false) rather than hard failures.
 */

import * as fs from 'fs/promises'
import * as path from 'path'

export const TEMPLATE_VERSION = '1.0.0'

let cachedCliVersion: string | null = null

export async function getCliVersion(): Promise<string> {
  if (cachedCliVersion !== null) {
    return cachedCliVersion
  }

  const packageJsonPath = path.join(__dirname, '../../package.json')
  const content = await fs.readFile(packageJsonPath, 'utf-8')
  const pkg = JSON.parse(content) as { version: string }
  cachedCliVersion = pkg.version
  return cachedCliVersion
}

export interface ManifestData {
  templateVersion: string
  cliVersion: string
  managedFiles: string[]
}

export type ManifestValidationResult =
  | { valid: true; data: ManifestData }
  | { valid: false; error: string }

export function validateManifest(raw: unknown): ManifestValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'Manifest must be a JSON object' }
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.templateVersion !== 'string' || obj.templateVersion.length === 0) {
    return { valid: false, error: 'Missing or invalid templateVersion: must be a non-empty string' }
  }

  if (typeof obj.cliVersion !== 'string' || obj.cliVersion.length === 0) {
    return { valid: false, error: 'Missing or invalid cliVersion: must be a non-empty string' }
  }

  if (!Array.isArray(obj.managedFiles) || !obj.managedFiles.every((f) => typeof f === 'string')) {
    return { valid: false, error: 'managedFiles must be an array of strings' }
  }

  return {
    valid: true,
    data: {
      templateVersion: obj.templateVersion,
      cliVersion: obj.cliVersion,
      managedFiles: obj.managedFiles as string[],
    },
  }
}

export type ManifestState =
  | { present: true; data: ManifestData }
  | { present: false; reason: 'missing' }
  | { present: false; reason: 'invalid'; error: string }

export const MANIFEST_RELATIVE_PATH = 'docs/.blueprint/manifest.json'

export function getManifestPath(projectPath: string): string {
  return path.join(projectPath, MANIFEST_RELATIVE_PATH)
}

export async function writeManifest(
  projectPath: string,
  data: ManifestData
): Promise<void> {
  const manifestPath = getManifestPath(projectPath)
  const manifestDir = path.dirname(manifestPath)

  try {
    await fs.mkdir(manifestDir, { recursive: true })
  } catch (err) {
    const error = err as { code?: string }
    if (error.code !== 'EEXIST') {
      throw err
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function readManifest(
  projectPath: string
): Promise<ManifestState> {
  const manifestPath = getManifestPath(projectPath)

  try {
    await fs.access(manifestPath)
  } catch {
    return { present: false, reason: 'missing' }
  }

  try {
    const raw = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
    const validation = validateManifest(raw)

    if (!validation.valid) {
      return { present: false, reason: 'invalid', error: validation.error }
    }

    return { present: true, data: validation.data }
  } catch (err) {
    const error = err as { message?: string }
    return { present: false, reason: 'invalid', error: error.message ?? 'Unknown error' }
  }
}
