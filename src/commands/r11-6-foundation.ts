import { readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { type AgentFileName } from '../init/types'
import { copyFileSafe } from '../init/fs-utils'
import { getCliVersion, TEMPLATE_VERSION, writeManifest } from '../doctor/manifest'
import { resolveTemplatePath } from '../doctor/inventory'
import { detectProjectMode, getSkillCanonicalFiles, SKILL_INSTALL_BASES, SUPPORTED_AGENT_FILES } from '../doctor/structure'
import { findProjectRoot, projectRootErrorMessage } from '../tracker/project-root'
import type { CommandDefinition } from '../runtime'
import {
  inspectSupportedRootAgentFiles,
  readAlignmentMarkerState,
  validateAlignmentCompletionRootFiles,
  type AlignmentMarkerState,
  type RootSetupBlockFailure,
  type SupportedRootAgentFileInspection,
} from './root-entry-point-setup'

export const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'
export const ALIGNMENT_COMPLETE_MARKER = '<!-- blueprint-status: alignment-complete -->'
export const LEGACY_MIGRATION_MARKER = '<!-- blueprint-origin: legacy-migration -->'

export type { AlignmentMarkerState, SupportedRootAgentFileInspection } from './root-entry-point-setup'

export interface SupportedRootAgentFileDiscovery {
  fileName: AgentFileName
  path: string
}

export interface SkillModeMigrationResult {
  projectMode: 'skill' | 'legacy'
  installedSkillRoots: string[]
  convertedRootFiles: AgentFileName[]
  manifestManagedFiles: AgentFileName[]
}

export interface AlignmentCompleteResult {
  changed: AgentFileName[]
  alreadyComplete: AgentFileName[]
  missingMarker: AgentFileName[]
  skipped: AgentFileName[]
}

export interface AlignmentCompletionPlumbingResult {
  changed: AgentFileName[]
  alreadyComplete: AgentFileName[]
  markerless: AgentFileName[]
  skipped: AgentFileName[]
  failed: RootSetupBlockFailure[]
  legacyOriginCleaned: AgentFileName[]
  warnings: string[]
}

function skillTemplatePath(fileName: AgentFileName): string {
  return join(__dirname, '../../templates/skill', fileName)
}

function renderForcedRealignmentTemplateContent(templateContent: string): string {
  const normalized = templateContent.endsWith('\n') ? templateContent : `${templateContent}\n`

  if (normalized.includes(ALIGNMENT_REQUIRED_MARKER)) {
    return normalized.replace(
      ALIGNMENT_REQUIRED_MARKER,
      `${LEGACY_MIGRATION_MARKER}\n${ALIGNMENT_REQUIRED_MARKER}`,
    )
  }

  return `${normalized}${LEGACY_MIGRATION_MARKER}\n${ALIGNMENT_REQUIRED_MARKER}\n`
}

async function writeForcedRealignmentTemplate(projectRoot: string, fileName: AgentFileName): Promise<void> {
  const templateContent = await readFile(skillTemplatePath(fileName), 'utf-8')
  await writeFile(
    join(projectRoot, fileName),
    renderForcedRealignmentTemplateContent(templateContent),
    'utf-8',
  )
}

function renderAlignmentCompleteSummary(result: AlignmentCompleteResult): string {
  const sections = [
    result.changed.length > 0 ? `Changed: ${result.changed.join(', ')}` : null,
    result.alreadyComplete.length > 0 ? `Already complete: ${result.alreadyComplete.join(', ')}` : null,
    result.missingMarker.length > 0 ? `Missing marker: ${result.missingMarker.join(', ')}` : null,
    result.skipped.length > 0 ? `Skipped absent: ${result.skipped.join(', ')}` : null,
  ].filter((line): line is string => line !== null)

  return sections.join('\n')
}

function removeLegacyMigrationMarker(content: string): { updated: string; removed: boolean } {
  const lines = content.split('\n')
  const filtered = lines.filter((line) => line !== LEGACY_MIGRATION_MARKER)

  return {
    updated: filtered.join('\n'),
    removed: filtered.length !== lines.length,
  }
}

export async function runAlignmentCompletionPlumbing(projectRoot: string): Promise<AlignmentCompletionPlumbingResult> {
  const validation = await validateAlignmentCompletionRootFiles(projectRoot)
  const result: AlignmentCompletionPlumbingResult = {
    changed: [],
    alreadyComplete: validation.alreadyComplete.map((entry) => entry.fileName),
    markerless: validation.markerless.map((entry) => entry.fileName),
    skipped: validation.absent.map((entry) => entry.fileName),
    failed: validation.failures,
    legacyOriginCleaned: [],
    warnings: validation.failures.map((failure) => failure.message),
  }

  if (validation.failures.length > 0) {
    return result
  }

  for (const entry of [...validation.required, ...validation.alreadyComplete]) {
    const content = await readFile(entry.path, 'utf-8')
    const markerUpdated =
      entry.state === 'required'
        ? content.replaceAll(ALIGNMENT_REQUIRED_MARKER, ALIGNMENT_COMPLETE_MARKER)
        : content
    const legacyCleaned = removeLegacyMigrationMarker(markerUpdated)

    if (legacyCleaned.updated !== content) {
      await writeFile(entry.path, legacyCleaned.updated, 'utf-8')
    }

    if (entry.state === 'required') {
      result.changed.push(entry.fileName)
    }

    if (legacyCleaned.removed) {
      result.legacyOriginCleaned.push(entry.fileName)
    }
  }

  return result
}

async function completeAlignmentMarkers(projectRoot: string): Promise<AlignmentCompleteResult> {
  const inspected = await inspectSupportedRootAgentFiles(projectRoot)
  const result: AlignmentCompleteResult = {
    changed: [],
    alreadyComplete: [],
    missingMarker: [],
    skipped: [],
  }

  for (const entry of inspected) {
    switch (entry.state) {
      case 'required': {
        const content = await readFile(entry.path, 'utf-8')
        const updated = content.replaceAll(ALIGNMENT_REQUIRED_MARKER, ALIGNMENT_COMPLETE_MARKER)
        if (updated !== content) {
          await writeFile(entry.path, updated, 'utf-8')
        }
        result.changed.push(entry.fileName)
        break
      }
      case 'complete':
        result.alreadyComplete.push(entry.fileName)
        break
      case 'missing-marker':
        result.missingMarker.push(entry.fileName)
        break
      case 'absent':
        result.skipped.push(entry.fileName)
        break
    }
  }

  return result
}

export { inspectSupportedRootAgentFiles, readAlignmentMarkerState }

export async function listExistingSupportedRootAgentFiles(
  projectRoot: string,
): Promise<SupportedRootAgentFileDiscovery[]> {
  return (await inspectSupportedRootAgentFiles(projectRoot))
    .filter((entry) => entry.state !== 'absent')
    .map(({ fileName, path }) => ({
      fileName,
      path,
    }))
}

export async function installBlueprintSkillPayloadRoots(projectRoot: string): Promise<string[]> {
  const normalizedRoot = resolve(projectRoot)

  for (const skillBase of SKILL_INSTALL_BASES) {
    await rm(join(normalizedRoot, skillBase), { force: true, recursive: true })

    for (const relativePath of getSkillCanonicalFiles(skillBase)) {
      await copyFileSafe(resolveTemplatePath(relativePath), join(normalizedRoot, relativePath))
    }
  }

  return [...SKILL_INSTALL_BASES]
}

export async function convertExistingSupportedRootAgentFiles(projectRoot: string): Promise<AgentFileName[]> {
  const normalizedRoot = resolve(projectRoot)
  const converted: AgentFileName[] = []

  for (const fileName of SUPPORTED_AGENT_FILES as AgentFileName[]) {
    const filePath = join(normalizedRoot, fileName)
    const state = await readAlignmentMarkerState(filePath)

    if (state === 'absent') {
      continue
    }

    await writeForcedRealignmentTemplate(normalizedRoot, fileName)

    converted.push(fileName)
  }

  return converted
}

export async function removeDocsCoreDirectory(projectRoot: string): Promise<void> {
  await rm(join(resolve(projectRoot), 'docs', 'core'), { force: true, recursive: true })
}

export async function updateOrBootstrapSkillModeManifest(
  projectRoot: string,
  managedFiles: AgentFileName[],
): Promise<void> {
  await writeManifest(resolve(projectRoot), {
    templateVersion: TEMPLATE_VERSION,
    cliVersion: await getCliVersion(),
    managedFiles,
  })
}

export async function migrateBlueprintProject(projectRoot: string): Promise<SkillModeMigrationResult> {
  const modeDetection = await detectProjectMode(projectRoot)
  const installedSkillRoots = await installBlueprintSkillPayloadRoots(projectRoot)
  const existingFiles = await listExistingSupportedRootAgentFiles(projectRoot)
  const manifestManagedFiles = existingFiles.map((entry) => entry.fileName)

  if (modeDetection.mode === 'skill') {
    await updateOrBootstrapSkillModeManifest(projectRoot, manifestManagedFiles)

    return {
      projectMode: 'skill',
      installedSkillRoots,
      convertedRootFiles: [],
      manifestManagedFiles,
    }
  }

  const convertedRootFiles = await convertExistingSupportedRootAgentFiles(projectRoot)

  await removeDocsCoreDirectory(projectRoot)
  await updateOrBootstrapSkillModeManifest(
    projectRoot,
    manifestManagedFiles,
  )

  return {
    projectMode: 'legacy',
    installedSkillRoots,
    convertedRootFiles,
    manifestManagedFiles,
  }
}

export const alignmentCompleteCommand: CommandDefinition = {
  name: 'alignment-complete',
  handler: async () => {
    try {
      const projectRoot = findProjectRoot(process.cwd())
      const result = await completeAlignmentMarkers(projectRoot)
      const summary = renderAlignmentCompleteSummary(result)

      if (summary.length > 0) {
        process.stdout.write(`${summary}\n`)
      }

      return { exitCode: 0 }
    } catch (error) {
      const message = error instanceof Error ? error.message : projectRootErrorMessage
      process.stderr.write(`Blueprint alignment-complete failed: ${message}\n`)
      return { exitCode: 1 }
    }
  },
}

export const migrateCommand: CommandDefinition = {
  name: 'migrate',
  handler: async () => {
    try {
      const projectRoot = findProjectRoot(process.cwd())
      const result = await migrateBlueprintProject(projectRoot)

      if (result.projectMode === 'skill') {
        console.log('Blueprint project is already in skill mode.')
        return { exitCode: 0 }
      }

      console.log('Migrated Blueprint project to skill mode.')
      console.log(
        `Installed ${result.installedSkillRoots.length} skill roots, converted ${result.convertedRootFiles.length} root files, removed docs/core, and updated the manifest.`,
      )
      console.log(
        'Migration forces fresh Alignment: converted root files receive `blueprint-origin: legacy-migration`, end in `alignment-required`, and never preserve `alignment-complete`.',
      )
      console.log('The Alignment workflow owns preservation or correction of old guidance.')
      return { exitCode: 0 }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return { exitCode: 1 }
    }
  },
}
