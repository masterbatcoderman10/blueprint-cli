import { describe, expect, it } from 'vitest'

import { getSkillCanonicalFiles } from '../../../src/doctor/structure'
import {
  REPO_ROOT_SKILL_PAYLOAD_ROOT,
  SKILL_PAYLOAD_INVENTORY,
  TEMPLATE_SKILL_PAYLOAD_ROOT,
  getPackagedSkillPayloadPaths,
  getRepoRootSkillPayloadPaths,
  getTemplateSkillPayloadPaths,
} from '../../../src/release/skill-payload-inventory'

describe('R11-4.0 skill payload inventory', () => {
  it('T-R11-4.0.1.1 exports the exact 24-file skill payload with template and repo-root path pairs', () => {
    const expectedTemplatePaths = getSkillCanonicalFiles(TEMPLATE_SKILL_PAYLOAD_ROOT)
    const expectedRepoRootPaths = getSkillCanonicalFiles(REPO_ROOT_SKILL_PAYLOAD_ROOT)

    expect(SKILL_PAYLOAD_INVENTORY).toEqual(
      expectedTemplatePaths.map((templatePath, index) => ({
        templatePath,
        repoRootPath: expectedRepoRootPaths[index],
        packagePath: expectedRepoRootPaths[index],
      })),
    )
    expect(SKILL_PAYLOAD_INVENTORY).toHaveLength(24)
    expect(getTemplateSkillPayloadPaths()).toContain(
      'templates/skills/blueprint/reference/foundation-planning.md',
    )
    expect(getRepoRootSkillPayloadPaths()).toContain(
      'skills/blueprint/reference/foundation-planning.md',
    )
  })

  it('T-R11-4.0.1.2 derives every mirror and release helper path list from the shared inventory export', () => {
    expect(getTemplateSkillPayloadPaths()).toEqual(
      SKILL_PAYLOAD_INVENTORY.map((entry) => entry.templatePath),
    )
    expect(getRepoRootSkillPayloadPaths()).toEqual(
      SKILL_PAYLOAD_INVENTORY.map((entry) => entry.repoRootPath),
    )
    expect(getPackagedSkillPayloadPaths()).toEqual(
      SKILL_PAYLOAD_INVENTORY.map((entry) => entry.packagePath),
    )
  })

  it('T-R11-4.0.1.3 stays aligned with the Phase 1 and 2 canonical skill path contract', () => {
    expect(getTemplateSkillPayloadPaths()).toEqual(
      getSkillCanonicalFiles(TEMPLATE_SKILL_PAYLOAD_ROOT),
    )
    expect(getRepoRootSkillPayloadPaths()).toEqual(
      getSkillCanonicalFiles(REPO_ROOT_SKILL_PAYLOAD_ROOT),
    )
  })
})
