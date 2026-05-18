import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runDoctorAudit } from '../../src/doctor/audit'
import { executeRepairs, renderRepairResult } from '../../src/doctor/executor'
import { createRepairPlan, renderRepairPlan } from '../../src/doctor/repair'
import { type TrackerSnapshot, writeSnapshotAtomic } from '../../src/tracker/export'
import { openDb, openDbReadOnly, trackerDbPath } from '../../src/tracker/db'
import { writeCanonicalProject } from '../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeProjectDir(name: string): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), `${name}-`))
  tempDirs.push(projectDir)
  return projectDir
}

async function writePreR6Project(projectDir: string): Promise<void> {
  await writeCanonicalProject(projectDir, {
    editableDocs: {
      'docs/project-progress.md': [
        '**Project**: migration-fixture',
        '**Tagline**: Doctor migration coverage',
      ].join('\n'),
    },
  })
}

function sampleSnapshot(): TrackerSnapshot {
  return {
    tasks: [
      {
        id: 'R6-4.B.snapshot-task',
        title: 'Imported task',
        description: 'Comes from tasks.export.json',
        state: 'IN-REVIEW',
        phase: 'Phase 4 — Migration & Doctor Integration',
        stream: 'B',
        author: 'Snapshot',
        implementation_notes: 'Imported during migration',
        created_at: 100,
        updated_at: 101,
      },
    ],
    comments: [],
    meta: {
      id: 1,
      name: 'snapshot-project',
      tagline: 'Imported from snapshot',
      phase_count: null,
      stream_count: null,
      created_at: 50,
      updated_at: 51,
    },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('Stream B — pre-R6 tracker migration', () => {
  it('T-R6-4.B.1.1: emits exactly one missing-tracker-db finding when docs/.blueprint/tasks.db is absent', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b1-missing-db')
    await writePreR6Project(projectDir)

    const result = await runDoctorAudit(projectDir)
    const findings = result.findings.filter((finding) => finding.kind === 'missing-tracker-db')

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      kind: 'missing-tracker-db',
      targetPath: 'docs/.blueprint/tasks.db',
      repairable: true,
    })
  })

  it('T-R6-4.B.1.2: does not emit missing-tracker-db when docs/.blueprint/tasks.db already exists', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b1-has-db')
    await writePreR6Project(projectDir)

    const handle = openDb(projectDir)
    handle.close()

    const result = await runDoctorAudit(projectDir)
    expect(result.findings.some((finding) => finding.kind === 'missing-tracker-db')).toBe(false)
  })

  it('T-R6-4.B.2.1: composite repair provisions the DB, seeds project_meta, and creates .gitignore on a bare fixture', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b2-bare')
    await writePreR6Project(projectDir)

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)

    expect(repairPlan.actions).toHaveLength(1)
    expect(repairPlan.actions[0]?.type).toBe('migrate-tracker-db')

    const repairResult = await executeRepairs(repairPlan.actions, projectDir)
    expect(repairResult.success).toBe(true)

    await expect(access(trackerDbPath(projectDir))).resolves.toBeUndefined()
    const readOnly = openDbReadOnly(projectDir)
    try {
      const meta = readOnly.db.prepare('SELECT name, tagline FROM project_meta WHERE id = 1').get() as
        | { name: string; tagline: string | null }
        | undefined
      expect(meta).toEqual({
        name: 'migration-fixture',
        tagline: 'Doctor migration coverage',
      })
    } finally {
      readOnly.close()
    }

    const gitignore = await readFile(join(projectDir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('# Blueprint')
    expect(gitignore).toContain('docs/.blueprint/tasks.db')

    expect(repairResult.actionResults[0]?.steps.map((step) => step.outcome)).toEqual([
      'created-db',
      'skipped-snapshot',
      'seeded-meta',
      'gitignore-modified',
    ])
  })

  it('T-R6-4.B.2.2: valid tasks.export.json imports rows and skips project_meta seeding', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b2-snapshot')
    await writePreR6Project(projectDir)
    await writeSnapshotAtomic(projectDir, sampleSnapshot())

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)

    expect(repairResult.success).toBe(true)

    const readOnly = openDbReadOnly(projectDir)
    try {
      const taskIds = readOnly.db.prepare('SELECT id FROM tasks ORDER BY id').all() as Array<{ id: string }>
      const meta = readOnly.db.prepare('SELECT name, tagline FROM project_meta WHERE id = 1').get() as
        | { name: string; tagline: string | null }
        | undefined

      expect(taskIds).toEqual([{ id: 'R6-4.B.snapshot-task' }])
      expect(meta).toEqual({
        name: 'snapshot-project',
        tagline: 'Imported from snapshot',
      })
    } finally {
      readOnly.close()
    }

    expect(repairResult.actionResults[0]?.steps.map((step) => step.outcome)).toEqual([
      'created-db',
      'imported-from-snapshot',
      'skipped-meta-already-present',
      'gitignore-modified',
    ])
  })

  it('T-R6-4.B.2.3: malformed tasks.export.json warns and falls back to seedProjectMeta without aborting', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b2-bad-snapshot')
    await writePreR6Project(projectDir)
    await writeFile(join(projectDir, 'docs', '.blueprint', 'tasks.export.json'), '{bad json', 'utf-8')

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)

    expect(repairResult.success).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('tracker snapshot import skipped')

    const readOnly = openDbReadOnly(projectDir)
    try {
      const meta = readOnly.db.prepare('SELECT name, tagline FROM project_meta WHERE id = 1').get() as
        | { name: string; tagline: string | null }
        | undefined
      expect(meta).toEqual({
        name: 'migration-fixture',
        tagline: 'Doctor migration coverage',
      })
    } finally {
      readOnly.close()
    }

    expect(repairResult.actionResults[0]?.steps.map((step) => step.outcome)).toEqual([
      'created-db',
      'skipped-snapshot',
      'seeded-meta',
      'gitignore-modified',
    ])
  })

  it('T-R6-4.B.2.4: repair result captures all four migrate-tracker-db sub-step outcomes', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b2-result-shape')
    await writePreR6Project(projectDir)
    await writeFile(join(projectDir, '.gitignore'), '# Existing\n', 'utf-8')

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)
    const actionResult = repairResult.actionResults[0]

    expect(actionResult).toMatchObject({
      type: 'migrate-tracker-db',
      targetPath: 'docs/.blueprint/tasks.db',
    })
    expect(actionResult?.steps).toHaveLength(4)
    expect(actionResult?.steps.map((step) => step.outcome)).toEqual([
      'created-db',
      'skipped-snapshot',
      'seeded-meta',
      'gitignore-modified',
    ])
  })

  it('T-R6-4.B.3.1: renderRepairPlan shows the composite migrate-tracker-db action with four numbered sub-steps', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b3-plan')
    await writePreR6Project(projectDir)

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
    const output = renderRepairPlan(repairPlan)

    expect(output).toContain('[migrate-tracker-db]')
    expect(output).toContain('1. [will-run] Create tracker database')
    expect(output).toContain('2. [will-run] Import tasks.export.json snapshot if present')
    expect(output).toContain('3. [will-run] Seed project_meta from docs/project-progress.md if still empty')
    expect(output).toContain('4. [will-run] Ensure .gitignore contains docs/.blueprint/tasks.db')
  })

  it('T-R6-4.B.3.2: renderRepairResult shows per-sub-step statuses for migrate-tracker-db', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b3-result')
    await writePreR6Project(projectDir)

    const auditResult = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)
    const output = renderRepairResult(repairResult)

    expect(output).toContain('migrate-tracker-db')
    expect(output).toContain('1. [applied] Create tracker database')
    expect(output).toContain('2. [skipped (no snapshot)] Import tasks.export.json snapshot if present')
    expect(output).toContain('3. [applied] Seed project_meta from docs/project-progress.md if still empty')
    expect(output).toContain('4. [applied] Ensure .gitignore contains docs/.blueprint/tasks.db')
  })

  it('T-R6-4.B.4: second consecutive doctor run is clean after the composite repair', async () => {
    const projectDir = await makeProjectDir('blueprint-r6-b4-idempotent')
    await writePreR6Project(projectDir)

    const firstAudit = await runDoctorAudit(projectDir)
    const repairPlan = await createRepairPlan(firstAudit.findings, projectDir)
    const repairResult = await executeRepairs(repairPlan.actions, projectDir)

    expect(repairResult.success).toBe(true)

    const secondAudit = await runDoctorAudit(projectDir)
    expect(secondAudit.isClean).toBe(true)
    expect(secondAudit.findings).toEqual([])
  })
})
