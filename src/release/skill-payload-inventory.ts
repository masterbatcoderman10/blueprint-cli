import { getSkillCanonicalFiles } from '../doctor/structure'

export interface SkillPayloadInventoryEntry {
  templatePath: string
  repoRootPath: string
  packagePath: string
}

export const TEMPLATE_SKILL_PAYLOAD_ROOT = 'templates/skills/blueprint'
export const REPO_ROOT_SKILL_PAYLOAD_ROOT = 'skills/blueprint'
export const SKILL_PAYLOAD_COUNT = 24

const templatePaths = getSkillCanonicalFiles(TEMPLATE_SKILL_PAYLOAD_ROOT)
const repoRootPaths = getSkillCanonicalFiles(REPO_ROOT_SKILL_PAYLOAD_ROOT)

if (templatePaths.length !== repoRootPaths.length) {
  throw new Error('Skill payload inventory roots drifted out of alignment.')
}

if (templatePaths.length !== SKILL_PAYLOAD_COUNT) {
  throw new Error(
    `Skill payload inventory expected ${SKILL_PAYLOAD_COUNT} files but found ${templatePaths.length}.`,
  )
}

export const SKILL_PAYLOAD_INVENTORY: SkillPayloadInventoryEntry[] = templatePaths.map(
  (templatePath, index) => ({
    templatePath,
    repoRootPath: repoRootPaths[index],
    packagePath: repoRootPaths[index],
  }),
)

export function getTemplateSkillPayloadPaths(): string[] {
  return SKILL_PAYLOAD_INVENTORY.map((entry) => entry.templatePath)
}

export function getRepoRootSkillPayloadPaths(): string[] {
  return SKILL_PAYLOAD_INVENTORY.map((entry) => entry.repoRootPath)
}

export function getPackagedSkillPayloadPaths(): string[] {
  return SKILL_PAYLOAD_INVENTORY.map((entry) => entry.packagePath)
}
