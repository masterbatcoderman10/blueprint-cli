/**
 * Stream C — Repair & Update Flow
 * Task C.1: Repair Planner Tests
 * 
 * Tests for the repair planner that maps Doctor findings to repair actions.
 */

import { describe, it, expect } from 'vitest'
import { createRepairPlan, renderRepairPlan } from '../../../src/doctor/repair'
import {
  createMissingStructureFinding,
  createDriftedFileFinding,
  createMissingManifestFinding,
  createTemplateVersionMismatchFinding,
  createManifestValidationErrorFinding,
  type DoctorFinding,
} from '../../../src/doctor/findings'
import { MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'

describe('T-C.1: Repair Planner', () => {
  const projectDir = '/tmp/test-project'

  describe('T-C.1.1: Missing canonical files → create-from-template actions', () => {
    it('maps missing docs/core file to create action', async () => {
      const findings: DoctorFinding[] = [
        createMissingStructureFinding('docs/core/execution.md', 'file'),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.hasBlockingFindings).toBe(false)
      expect(plan.actions).toHaveLength(1)
      expect(plan.actions[0].type).toBe('create-from-template')
      expect(plan.actions[0].targetPath).toBe('docs/core/execution.md')
      expect(plan.actions[0].description).toContain('Create missing file from template')
    })

    it('maps missing directory to create action', async () => {
      const findings: DoctorFinding[] = [
        createMissingStructureFinding('docs/milestones', 'directory'),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.actions).toHaveLength(1)
      expect(plan.actions[0].type).toBe('create-from-template')
      expect(plan.actions[0].targetPath).toBe('docs/milestones')
      expect(plan.actions[0].description).toContain('Create missing directory')
    })
  })

  describe('T-C.1.2: Drifted canonical files → replace-in-place actions', () => {
    it('maps drifted core file to replace action', async () => {
      const findings: DoctorFinding[] = [
        createDriftedFileFinding('docs/core/execution.md'),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.actions).toHaveLength(1)
      expect(plan.actions[0].type).toBe('replace-in-place')
      expect(plan.actions[0].targetPath).toBe('docs/core/execution.md')
      expect(plan.actions[0].description).toContain('Replace drifted canonical file')
    })

    it('maps drifted managed agent file to replace action', async () => {
      const findings: DoctorFinding[] = [
        createDriftedFileFinding('CLAUDE.md'),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.actions).toHaveLength(1)
      expect(plan.actions[0].type).toBe('replace-in-place')
      expect(plan.actions[0].targetPath).toBe('CLAUDE.md')
      expect(plan.actions[0].description).toContain('Replace drifted managed agent file')
    })
  })

  describe('T-C.1.3: Missing manifest → bootstrap-manifest actions', () => {
    it('maps missing manifest to bootstrap action', async () => {
      const findings: DoctorFinding[] = [
        createMissingManifestFinding(MANIFEST_RELATIVE_PATH),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.actions).toHaveLength(1)
      expect(plan.actions[0].type).toBe('bootstrap-manifest')
      expect(plan.actions[0].targetPath).toBe(MANIFEST_RELATIVE_PATH)
      expect(plan.actions[0].description).toContain('Bootstrap manifest metadata')
      expect(plan.actions[0].manifestData).toBeDefined()
      expect(plan.actions[0].manifestData?.templateVersion).toBeDefined()
      expect(plan.actions[0].manifestData?.cliVersion).toBeDefined()
    })
  })

  describe('T-C.1.4: Editable docs and unselected files untouched', () => {
    it('does not create repair actions for version mismatch findings', async () => {
      const findings: DoctorFinding[] = [
        createTemplateVersionMismatchFinding(
          MANIFEST_RELATIVE_PATH,
          '0.9.0',
          '1.0.0',
          'Consider updating to the latest template version.',
        ),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      // Version mismatch is informational only in Phase 3
      expect(plan.actions).toHaveLength(0)
      expect(plan.hasBlockingFindings).toBe(false)
    })

    it('has blocking findings for manifest validation errors', async () => {
      const findings: DoctorFinding[] = [
        createManifestValidationErrorFinding(
          MANIFEST_RELATIVE_PATH,
          'Manifest contains invalid JSON',
        ),
      ]

      const plan = await createRepairPlan(findings, projectDir)

      expect(plan.hasBlockingFindings).toBe(true)
      expect(plan.blockingReason).toContain('invalid JSON')
      expect(plan.actions).toHaveLength(0)
    })
  })

  describe('renderRepairPlan', () => {
    it('renders blocking finding message', async () => {
      const findings: DoctorFinding[] = [
        createManifestValidationErrorFinding(MANIFEST_RELATIVE_PATH, 'Invalid schema'),
      ]

      const plan = await createRepairPlan(findings, projectDir)
      const output = renderRepairPlan(plan)

      expect(output).toContain('Cannot proceed with repairs')
      expect(output).toContain('Invalid schema')
    })

    it('renders no repairs needed message', async () => {
      const plan = { actions: [], hasBlockingFindings: false }
      const output = renderRepairPlan(plan)

      expect(output).toContain('No repairs needed')
    })

    it('renders proposed repairs list', async () => {
      const findings: DoctorFinding[] = [
        createMissingStructureFinding('docs/core/execution.md', 'file'),
        createDriftedFileFinding('CLAUDE.md'),
      ]

      const plan = await createRepairPlan(findings, projectDir)
      const output = renderRepairPlan(plan)

      expect(output).toContain('Proposed repairs:')
      expect(output).toContain('1. [create-from-template]')
      expect(output).toContain('2. [replace-in-place]')
      expect(output).toContain('Total: 2 repair(s)')
    })
  })
})
