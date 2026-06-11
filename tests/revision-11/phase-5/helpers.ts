import { readFile, readdir } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import { SKILL_PAYLOAD_INVENTORY } from '../../../src/release/skill-payload-inventory'

export const ROOT_ENTRY_POINT_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'] as const

export const LOCAL_SKILL_PAYLOAD_ROOT = '.claude/skills/blueprint'

export const ACTIVE_CROSS_REFERENCE_STATIC_FILES = [
  ...ROOT_ENTRY_POINT_FILES,
  'README.md',
  'CHANGELOG.md',
  'docs/project-progress.md',
  'docs/prd.md',
  'docs/release-contract.md',
  'docs/releasing.md',
  'docs/srs.md',
  'package.json',
] as const

const ACTIVE_CROSS_REFERENCE_DIRECTORIES = [
  'docs/core',
  'templates',
  'skills/blueprint',
  LOCAL_SKILL_PAYLOAD_ROOT,
] as const

export const CROSS_REFERENCE_CATEGORIES = [
  'deleted-conventions',
  'legacy-primary-routing',
  'conflicting-install-guidance',
  'docs-core-only-protocols',
] as const

export type CrossReferenceCategory = (typeof CROSS_REFERENCE_CATEGORIES)[number]

export interface CrossReferenceFinding {
  category: CrossReferenceCategory
  file: string
  line: number
  excerpt: string
}

export interface RootEntryPointTemplatePair {
  fileName: (typeof ROOT_ENTRY_POINT_FILES)[number]
  rootPath: string
  templatePath: string
}

export interface LocalSkillPayloadEntry {
  templatePath: string
  localInstallPath: string
  relativePath: string
}

export const FORBIDDEN_ROOT_LEGACY_BLOCKS = ['<SessionStart>', '<HardRules>', '<ModuleRouting>'] as const

export function getRootEntryPointTemplatePairs(root = resolve(process.cwd())): RootEntryPointTemplatePair[] {
  return ROOT_ENTRY_POINT_FILES.map((fileName) => ({
    fileName,
    rootPath: resolve(root, fileName),
    templatePath: resolve(root, 'templates/skill', fileName),
  }))
}

export function getLocalSkillPayloadInventory(root = resolve(process.cwd())): LocalSkillPayloadEntry[] {
  return SKILL_PAYLOAD_INVENTORY.map((entry) => {
    const relativePath = entry.templatePath.replace('templates/skills/blueprint/', '')

    return {
      templatePath: resolve(root, entry.templatePath),
      localInstallPath: resolve(root, LOCAL_SKILL_PAYLOAD_ROOT, relativePath),
      relativePath,
    }
  })
}

export function getLocalSkillPayloadRelativePaths(): string[] {
  return SKILL_PAYLOAD_INVENTORY.map((entry) => entry.templatePath.replace('templates/skills/blueprint/', ''))
}

async function listFilesIfPresent(root: string, relativeDir: string): Promise<string[]> {
  const absoluteDir = resolve(root, relativeDir)

  try {
    return await listRelativeFiles(root, absoluteDir)
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function listRelativeFiles(root: string, currentDir = root): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        return listRelativeFiles(root, entryPath)
      }

      return Promise.resolve([toPosixPath(relative(root, entryPath))])
    }),
  )

  return files.flat()
}

function assertExactRelativeFiles(actualFiles: string[], expectedFiles: string[], label: string): void {
  const isExactMatch =
    actualFiles.length === expectedFiles.length && actualFiles.every((file, index) => file === expectedFiles[index])

  if (!isExactMatch) {
    throw new Error(
      `${label} must contain exactly the expected skill payload files.\nExpected: ${expectedFiles.join(', ')}\nActual: ${actualFiles.join(', ')}`,
    )
  }
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/')
}

async function staticFileIfPresent(root: string, relativePath: string): Promise<string[]> {
  try {
    const parent = resolve(root, relativePath, '..')
    const entries = await readdir(parent, { withFileTypes: true })
    const fileName = relativePath.split('/').at(-1)
    return entries.some((entry) => entry.isFile() && entry.name === fileName) ? [relativePath] : []
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function getActiveCrossReferenceFiles(root = resolve(process.cwd())): Promise<string[]> {
  const [staticFiles, directoryFiles] = await Promise.all([
    Promise.all(ACTIVE_CROSS_REFERENCE_STATIC_FILES.map((file) => staticFileIfPresent(root, file))),
    Promise.all(ACTIVE_CROSS_REFERENCE_DIRECTORIES.map((dir) => listFilesIfPresent(root, dir))),
  ])

  return [...staticFiles.flat(), ...directoryFiles.flat()]
    .filter((file) => !file.startsWith('docs/milestones/'))
    .sort()
}

export async function auditActiveCrossReferences(root = resolve(process.cwd())): Promise<CrossReferenceFinding[]> {
  const files = await getActiveCrossReferenceFiles(root)
  const findings = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(resolve(root, file), 'utf-8')
      return auditCrossReferenceContent(file, content)
    }),
  )

  return findings.flat()
}

export function auditCrossReferenceContent(file: string, content: string): CrossReferenceFinding[] {
  return content
    .split('\n')
    .flatMap((line, index) => auditCrossReferenceLine(file, index + 1, line))
}

function auditCrossReferenceLine(file: string, lineNumber: number, line: string): CrossReferenceFinding[] {
  const findings: CrossReferenceFinding[] = []
  const normalized = line.toLowerCase()

  if (referencesDeletedConventions(normalized) && !isAllowedDeletedConventionsReference(file, normalized)) {
    findings.push(createFinding('deleted-conventions', file, lineNumber, line))
  }

  if (referencesLegacyPrimaryRouting(file, normalized) && !isAllowedLegacyRoutingReference(normalized)) {
    findings.push(createFinding('legacy-primary-routing', file, lineNumber, line))
  }

  if (referencesConflictingInstallGuidance(file, normalized)) {
    findings.push(createFinding('conflicting-install-guidance', file, lineNumber, line))
  }

  if (referencesDocsCoreOnlyProtocols(file, normalized)) {
    findings.push(createFinding('docs-core-only-protocols', file, lineNumber, line))
  }

  return findings
}

function createFinding(
  category: CrossReferenceCategory,
  file: string,
  line: number,
  excerpt: string,
): CrossReferenceFinding {
  return {
    category,
    file,
    line,
    excerpt: excerpt.trim(),
  }
}

function referencesDeletedConventions(normalizedLine: string): boolean {
  return normalizedLine.includes('docs/conventions.md') || normalizedLine.includes('conventions.md')
}

function isAllowedDeletedConventionsReference(file: string, normalizedLine: string): boolean {
  if (file === 'CHANGELOG.md' || file === 'docs/project-progress.md') {
    return true
  }

  if (file === 'docs/srs.md') {
    return [
      'deleted',
      'sunset',
      'drop',
      'migrated',
      'legacy-mode',
      'doctor',
      'must be',
      'deletion',
    ].some((allowed) => normalizedLine.includes(allowed))
  }

  return false
}

function referencesLegacyPrimaryRouting(file: string, normalizedLine: string): boolean {
  return isSkillModeSurface(file) && normalizedLine.includes('modulerouting')
}

function isAllowedLegacyRoutingReference(normalizedLine: string): boolean {
  return [
    'does not',
    'do not',
    'must not',
    'no re-routing',
    'without',
    'rather than',
    'not by falling back',
  ].some((allowed) => normalizedLine.includes(allowed))
}

function referencesConflictingInstallGuidance(file: string, normalizedLine: string): boolean {
  if (!normalizedLine.includes('skill') && !normalizedLine.includes('skills')) {
    return false
  }

  if (
    (file === 'docs/project-progress.md' || file === 'docs/srs.md') &&
    normalizedLine.includes('smoke') &&
    normalizedLine.includes('npx skills add')
  ) {
    return false
  }

  const mentionsInstall = ['install', 'add', 'installer'].some((token) => normalizedLine.includes(token))
  if (!mentionsInstall) {
    return false
  }

  const isRecommendedNpxPath = normalizedLine.includes(
    'npx skills add masterbatcoderman10/blueprint-cli --skill blueprint',
  )
  const isDeferredFirstPartyScope =
    normalizedLine.includes('first-party') && normalizedLine.includes('defer')

  return (
    (normalizedLine.includes('npm install -g') && normalizedLine.includes('skill')) ||
    (normalizedLine.includes('blueprint install') && normalizedLine.includes('skill')) ||
    (normalizedLine.includes('first-party') && normalizedLine.includes('install') && !isDeferredFirstPartyScope) ||
    (normalizedLine.includes('skills add') && !isRecommendedNpxPath)
  )
}

function referencesDocsCoreOnlyProtocols(file: string, normalizedLine: string): boolean {
  return (
    isSkillModeSurface(file) &&
    normalizedLine.includes('blueprint protocol') &&
    normalizedLine.includes('under `docs/core')
  )
}

function isSkillModeSurface(file: string): boolean {
  return (
    ROOT_ENTRY_POINT_FILES.includes(file as (typeof ROOT_ENTRY_POINT_FILES)[number]) ||
    file.startsWith('templates/skill/') ||
    file.startsWith('templates/skills/blueprint/') ||
    file.startsWith('skills/blueprint/') ||
    file.startsWith(`${LOCAL_SKILL_PAYLOAD_ROOT}/`)
  )
}

export async function assertLocalSkillPayloadMirror(templateDir: string, localDir: string): Promise<void> {
  const expectedFiles = getLocalSkillPayloadRelativePaths().sort()
  const [templateFiles, localFiles] = await Promise.all([
    listRelativeFiles(templateDir).then((files) => files.sort()),
    listRelativeFiles(localDir).then((files) => files.sort()),
  ])

  assertExactRelativeFiles(templateFiles, expectedFiles, `templates/skills/blueprint at ${templateDir}`)
  assertExactRelativeFiles(localFiles, expectedFiles, `.claude/skills/blueprint at ${localDir}`)

  await Promise.all(
    expectedFiles.map(async (relativePath) => {
      const [templateBytes, localBytes] = await Promise.all([
        readFile(resolve(templateDir, relativePath)),
        readFile(resolve(localDir, relativePath)),
      ])

      if (Buffer.compare(templateBytes, localBytes) !== 0) {
        throw new Error(`${relativePath} must be byte-identical between ${templateDir} and ${localDir}`)
      }
    }),
  )
}

export function extractProjectConventionsBlock(content: string): string {
  const start = content.indexOf('<ProjectConventions>')
  const end = content.indexOf('</ProjectConventions>')

  if (start === -1 || end === -1) {
    return ''
  }

  const block = content.slice(start, end + '</ProjectConventions>'.length)
  return block.endsWith('\n') ? block : `${block}\n`
}

export async function assertRootEntryPointSkillModeContract(root = resolve(process.cwd())): Promise<void> {
  const pairs = getRootEntryPointTemplatePairs(root)
  const canonicalSnippet = await readFile(resolve(root, 'templates/skill/_project-conventions.snippet.md'), 'utf-8')

  await Promise.all(
    pairs.map(async ({ fileName, rootPath }) => {
      const rootContent = await readFile(rootPath, 'utf-8')

      if (!rootContent.toLowerCase().includes('blueprint')) {
        throw new Error(`${fileName} must invoke the blueprint skill`)
      }

      if (!rootContent.includes('<ProjectConventions>') || !rootContent.includes('</ProjectConventions>')) {
        throw new Error(`${fileName} must contain <ProjectConventions>`)
      }

      for (const block of FORBIDDEN_ROOT_LEGACY_BLOCKS) {
        if (rootContent.includes(block)) {
          throw new Error(`${fileName} must not contain legacy routing block ${block}`)
        }
      }

      const conventionsBlock = extractProjectConventionsBlock(rootContent)
      if (conventionsBlock !== canonicalSnippet) {
        throw new Error(`${fileName} must use the canonical ProjectConventions snippet`)
      }
    }),
  )
}
