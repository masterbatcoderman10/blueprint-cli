import { getSkillCanonicalFiles } from '../doctor/structure'

export interface SkillPayloadInventoryEntry {
  templatePath: string
  repoRootPath: string
  packagePath: string
}

export const TEMPLATE_SKILL_PAYLOAD_ROOT = 'templates/skills/blueprint'
export const REPO_ROOT_SKILL_PAYLOAD_ROOT = 'skills/blueprint'

const templatePaths = getSkillCanonicalFiles(TEMPLATE_SKILL_PAYLOAD_ROOT)
const repoRootPaths = getSkillCanonicalFiles(REPO_ROOT_SKILL_PAYLOAD_ROOT)

if (templatePaths.length !== repoRootPaths.length) {
  throw new Error('Skill payload inventory roots drifted out of alignment.')
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
