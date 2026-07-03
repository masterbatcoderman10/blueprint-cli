import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { type AgentFileName } from '../init/types'
import { copyFileSafe } from '../init/fs-utils'
import { getCliVersion, TEMPLATE_VERSION, writeManifest } from '../doctor/manifest'
import { resolveTemplatePath } from '../doctor/inventory'
import { detectProjectMode, getSkillCanonicalFiles, SKILL_INSTALL_BASES, SUPPORTED_AGENT_FILES } from '../doctor/structure'
import { findProjectRoot, projectRootErrorMessage } from '../tracker/project-root'
import type { CommandDefinition } from '../runtime'

export const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'
export const ALIGNMENT_COMPLETE_MARKER = '<!-- blueprint-status: alignment-complete -->'

export type AlignmentMarkerState = 'required' | 'complete' | 'missing-marker' | 'absent'

export interface SupportedRootAgentFileDiscovery {
  fileName: AgentFileName
  path: string
}

export interface SupportedRootAgentFileInspection extends SupportedRootAgentFileDiscovery {
  state: AlignmentMarkerState
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

function skillTemplatePath(fileName: AgentFileName): string {
  return join(__dirname, '../../templates/skill', fileName)
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

async function appendAlignmentMarker(filePath: string, marker: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8')
  const normalized = content.endsWith('\n') ? content : `${content}\n`
  await writeFile(filePath, `${normalized}${marker}\n`, 'utf-8')
}

async function copyRootAgentTemplate(projectRoot: string, fileName: AgentFileName): Promise<void> {
  await copyFileSafe(skillTemplatePath(fileName), join(projectRoot, fileName))
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

export async function readAlignmentMarkerState(filePath: string): Promise<AlignmentMarkerState> {
  if (!(await fileExists(filePath))) {
    return 'absent'
  }

  const content = await readFile(filePath, 'utf-8')
  if (content.includes(ALIGNMENT_COMPLETE_MARKER)) {
    return 'complete'
  }

  if (content.includes(ALIGNMENT_REQUIRED_MARKER)) {
    return 'required'
  }

  return 'missing-marker'
}

export async function inspectSupportedRootAgentFiles(
  projectRoot: string,
): Promise<SupportedRootAgentFileInspection[]> {
  const normalizedRoot = resolve(projectRoot)
  const inspected: SupportedRootAgentFileInspection[] = []

  for (const fileName of SUPPORTED_AGENT_FILES as AgentFileName[]) {
    const path = join(normalizedRoot, fileName)
    inspected.push({
      fileName,
      path,
      state: await readAlignmentMarkerState(path),
    })
  }

  return inspected
}

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

    await copyRootAgentTemplate(normalizedRoot, fileName)

    if (state === 'complete') {
      await appendAlignmentMarker(filePath, ALIGNMENT_COMPLETE_MARKER)
    } else {
      await appendAlignmentMarker(filePath, ALIGNMENT_REQUIRED_MARKER)
    }

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

  if (modeDetection.mode === 'skill') {
    return {
      projectMode: 'skill',
      installedSkillRoots,
      convertedRootFiles: [],
      manifestManagedFiles: [],
    }
  }

  const existingFiles = await listExistingSupportedRootAgentFiles(projectRoot)
  const convertedRootFiles = await convertExistingSupportedRootAgentFiles(projectRoot)

  await removeDocsCoreDirectory(projectRoot)
  await updateOrBootstrapSkillModeManifest(
    projectRoot,
    existingFiles.map((entry) => entry.fileName),
  )

  return {
    projectMode: 'legacy',
    installedSkillRoots,
    convertedRootFiles,
    manifestManagedFiles: existingFiles.map((entry) => entry.fileName),
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
      return { exitCode: 0 }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return { exitCode: 1 }
    }
  },
}
