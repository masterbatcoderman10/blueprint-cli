import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { createIsolatedTempProject, type IsolatedTempProject } from '../../helpers/release'
import { resolveAllSkillTemplatePaths } from '../../../src/doctor/inventory'
import { getCliVersion, MANIFEST_RELATIVE_PATH, TEMPLATE_VERSION, writeManifest } from '../../../src/doctor/manifest'
import { SKILL_INSTALL_BASES, SUPPORTED_AGENT_FILES } from '../../../src/doctor/structure'
import type { AgentFileName } from '../../../src/init/types'
import { writeCanonicalProject } from '../../phase-3/stream-b/test-project'

export type AlignmentMarkerStateFixture = 'required' | 'complete' | 'missing-marker' | 'absent'
export type RootSetupBlockFixtureVariant = 'valid' | 'missing' | 'placeholder'

export const LEGACY_MIGRATION_MARKER = '<!-- blueprint-origin: legacy-migration -->'

export function buildRootSetupBlock(
  tagName: 'ProjectConventions' | 'AgentOrchestration',
  body: string,
): string {
  return `<${tagName}>\n${body}\n</${tagName}>`
}

function buildFixtureBlock(
  tagName: 'ProjectConventions' | 'AgentOrchestration',
  variant: RootSetupBlockFixtureVariant,
): string | null {
  if (variant === 'missing') {
    return null
  }

  if (variant === 'placeholder') {
    return buildRootSetupBlock(tagName, 'Alignment pending.')
  }

  return buildRootSetupBlock(
    tagName,
    tagName === 'ProjectConventions' ? '  shared' : '  orchestration',
  )
}

export interface SupportedRootFileFixtureOptions {
  markerState: AlignmentMarkerStateFixture
  projectConventions?: string
  agentOrchestration?: string
  projectConventionsVariant?: RootSetupBlockFixtureVariant
  agentOrchestrationVariant?: RootSetupBlockFixtureVariant
  includeLegacyMigrationMarker?: boolean
  extraBodyLines?: string[]
}

export async function createGateProject(prefix = 'blueprint-r11-6-gate-'): Promise<IsolatedTempProject> {
  return createIsolatedTempProject(prefix)
}

export async function writeLegacyModeProject(
  projectDir: string,
  options: { includeManifest?: boolean; managedFiles?: string[] } = {},
): Promise<void> {
  await writeCanonicalProject(projectDir, {
    includeManifest: options.includeManifest ?? false,
    includeTracker: false,
    managedFiles: options.managedFiles ?? ['CLAUDE.md'],
    includeSrsDoc: true,
  })
}

export async function writeSkillModeProject(
  projectDir: string,
  options: { includeManifest?: boolean; managedFiles?: string[] } = {},
): Promise<void> {
  await writeCanonicalProject(projectDir, {
    includeManifest: false,
    includeTracker: false,
    managedFiles: [],
    includeSrsDoc: true,
  })

  await rm(join(projectDir, 'docs', 'core'), { recursive: true, force: true })
  await writeRootSkillStubs(projectDir)
  await writeSkillInstallRoots(projectDir)
  await writeManifestFixture(projectDir, options.managedFiles ?? [...SUPPORTED_AGENT_FILES])

  if (options.includeManifest === false) {
    await rm(join(projectDir, MANIFEST_RELATIVE_PATH), { force: true })
  }
}

export async function writeRootSkillStubs(projectDir: string, managedFiles: string[] = [...SUPPORTED_AGENT_FILES]): Promise<void> {
  for (const fileName of managedFiles) {
    const destination = join(projectDir, fileName)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, await readFile(join(resolve(process.cwd()), 'templates', 'skill', fileName), 'utf-8'), 'utf-8')
  }
}

export async function writeSkillInstallRoots(projectDir: string): Promise<void> {
  for (const skillBase of SKILL_INSTALL_BASES) {
    for (const { relativePath, absolutePath } of resolveAllSkillTemplatePaths(skillBase)) {
      const destination = join(projectDir, relativePath)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, await readFile(absolutePath, 'utf-8'), 'utf-8')
    }
  }
}

export async function writeMarkerState(
  projectDir: string,
  fileName: string,
  state: AlignmentMarkerStateFixture,
): Promise<void> {
  const destination = join(projectDir, fileName)

  if (state === 'absent') {
    await rm(destination, { force: true })
    return
  }

  const marker =
    state === 'complete'
      ? '<!-- blueprint-status: alignment-complete -->'
      : state === 'required'
        ? '<!-- blueprint-status: alignment-required -->'
        : ''

  await mkdir(dirname(destination), { recursive: true })
  await writeFile(
    destination,
    ['# Blueprint', marker, ''].filter(Boolean).join('\n'),
    'utf-8',
  )
}

export async function writeSupportedRootFileFixture(
  projectDir: string,
  fileName: AgentFileName,
  options: SupportedRootFileFixtureOptions,
): Promise<void> {
  const destination = join(projectDir, fileName)

  if (options.markerState === 'absent') {
    await rm(destination, { force: true })
    return
  }

  const marker =
    options.markerState === 'complete'
      ? '<!-- blueprint-status: alignment-complete -->'
      : options.markerState === 'required'
        ? '<!-- blueprint-status: alignment-required -->'
        : null
  const projectConventions =
    options.projectConventions ??
    buildFixtureBlock('ProjectConventions', options.projectConventionsVariant ?? 'valid')
  const agentOrchestration =
    options.agentOrchestration ??
    buildFixtureBlock('AgentOrchestration', options.agentOrchestrationVariant ?? 'valid')

  await mkdir(dirname(destination), { recursive: true })
  await writeFile(
    destination,
    [
      '# Blueprint',
      '',
      ...(options.extraBodyLines ?? []),
      options.includeLegacyMigrationMarker ? LEGACY_MIGRATION_MARKER : null,
      projectConventions,
      agentOrchestration,
      marker,
      '',
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
    'utf-8',
  )
}

export async function writeManifestFixture(
  projectDir: string,
  managedFiles: string[] = ['CLAUDE.md'],
): Promise<void> {
  await writeManifest(projectDir, {
    templateVersion: TEMPLATE_VERSION,
    cliVersion: await getCliVersion(),
    managedFiles,
  })
}

export async function writeDocsCoreMigrationFixture(projectDir: string): Promise<void> {
  await writeLegacyModeProject(projectDir, { includeManifest: false })
}
