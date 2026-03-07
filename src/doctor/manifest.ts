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

export const TEMPLATE_VERSION = '1.0.0'

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

/**
 * ManifestState represents whether a Blueprint manifest is present in the project.
 *
 * present: true  — manifest exists and contains valid data
 * present: false — manifest is absent; this is a repairable legacy bootstrap case,
 *                  not a hard error. The integrity engine should offer to create it.
 */
export type ManifestState =
  | { present: true; data: ManifestData }
  | { present: false }

export const MANIFEST_RELATIVE_PATH = 'docs/.blueprint/manifest.json'
