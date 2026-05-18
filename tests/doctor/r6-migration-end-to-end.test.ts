import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runDoctorAudit } from '../../src/doctor/audit'
import { executeRepairs } from '../../src/doctor/executor'
import { createRepairPlan } from '../../src/doctor/repair'
import { type TrackerSnapshot, writeSnapshotAtomic } from '../../src/tracker/export'
import { openDbReadOnly, trackerDbPath } from '../../src/tracker/db'
import { writeCanonicalProject } from '../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeProjectDir(name: string): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), `${name}-`))
  tempDirs.push(projectDir)
  return projectDir
}

/**
 * Creates a synthetic pre-R6 fixture project with:
 * - No tasks.db (triggers missing-tracker-db finding)
 * - A drifted canonical core file (triggers drifted-file finding)
 * - A valid tasks.export.json with sample tasks, comments, and meta
 * - A project-progress.md with legacy **Kanban** field
 */
async function writePreR6EndToEndProject(projectDir: string): Promise<void> {
  // Write the canonical project structure (all core files match templates by default)
  await writeCanonicalProject(projectDir, {
    editableDocs: {
      'docs/project-progress.md': [
        '# Project Progress',
        '',
        '**Project**: migration-e2e-fixture',
        '**Kanban**: migration-e2e-fixture',
        '',
        '## Status',
        '',
        '- [ ] Health check passing',
      ].join('\n'),
    },
  })

  // Drift one canonical core file to differ from the template
  // This simulates a pre-R6 project where the core docs haven't been updated
  const driftedPath = join(projectDir, 'docs', 'core', 'alignment.md')
  const driftedContent = await readFile(driftedPath, 'utf-8')
  // Append a legacy section that the template doesn't have
  const patchedContent = driftedContent + '\n\n## Legacy Section\n\nThis section does not exist in the template.\n'
  await writeFile(driftedPath, patchedContent, 'utf-8')
}

function sampleSnapshot(): TrackerSnapshot {
  return {
    tasks: [
      {
        id: 'R6-4.D.snapshot-task-1',
        title: 'Imported task from snapshot',
        description: 'This task was in the tasks.export.json',
        state: 'TO-DO',
        phase: 'Phase 4 — Migration & Doctor Integration',
        stream: 'D',
        author: 'E2E-Test',
        implementation_notes: null,
        created_at: 200,
        updated_at: 201,
      },
      {
        id: 'R6-4.D.snapshot-task-2',
        title: 'Another imported task',
        description: 'Second task from snapshot',
        state: 'IN-REVIEW',
        phase: 'Phase 4 — Migration & Doctor Integration',
        stream: 'D',
        author: 'E2E-Test',
        implementation_notes: 'Under review',
        created_at: 300,
        updated_at: 301,
      },
    ],
    comments: [
      {
        id: 'R6-4.D.snap-comment-1',
        task_id: 'R6-4.D.snapshot-task-1',
        parent_id: null,
        severity: 'MINOR',
        body: 'Minor note on imported task',
        author: 'Reviewer',
        line: null,
        created_at: 250,
        updated_at: 251,
      },
    ],
    meta: {
      id: 1,
      name: 'snapshot-e2e-project',
      tagline: 'End-to-end migration fixture',
      phase_count: null,
      stream_count: null,
      created_at: 100,
      updated_at: 101,
    },
  }
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('Stream D — end-to-end migration verification', () => {
  describe('R6-4.D.1 end-to-end migration fixture', () => {
    it('T-R6-4.D.1.1: pre-R6 fixture emits both missing-tracker-db and drifted-file findings; composite repair runs alongside drift rewrite; post-repair DB has imported rows, drifted file is restored, .gitignore has the line', async () => {
      const projectDir = await makeProjectDir('blueprint-r6-e2e-migration')
      await writePreR6EndToEndProject(projectDir)
      await writeSnapshotAtomic(projectDir, sampleSnapshot())

      // Audit the pre-R6 project
      const auditResult = await runDoctorAudit(projectDir)

      // Assert BOTH finding types are present
      const missingDbFinding = auditResult.findings.find(
        (f) => f.kind === 'missing-tracker-db',
      )
      const driftedFinding = auditResult.findings.find(
        (f) => f.kind === 'drifted-file',
      )

      expect(missingDbFinding).toBeDefined()
      expect(missingDbFinding).toMatchObject({
        kind: 'missing-tracker-db',
        targetPath: 'docs/.blueprint/tasks.db',
        repairable: true,
      })

      expect(driftedFinding).toBeDefined()
      expect(driftedFinding).toMatchObject({
        kind: 'drifted-file',
        repairable: true,
      })

      // Create and execute the repair plan
      const repairPlan = await createRepairPlan(auditResult.findings, projectDir)
      expect(repairPlan.hasBlockingFindings).toBe(false)

      const repairResult = await executeRepairs(repairPlan.actions, projectDir)
      expect(repairResult.success).toBe(true)

      // Post-repair assertions:

      // 1. DB exists with imported rows
      await expect(access(trackerDbPath(projectDir))).resolves.toBeUndefined()
      const readOnly = openDbReadOnly(projectDir)
      try {
        const tasks = readOnly.db.prepare('SELECT id, title FROM tasks ORDER BY id').all() as Array<{
          id: string
          title: string
        }>
        expect(tasks).toEqual([
          { id: 'R6-4.D.snapshot-task-1', title: 'Imported task from snapshot' },
          { id: 'R6-4.D.snapshot-task-2', title: 'Another imported task' },
        ])

        const comments = readOnly.db.prepare('SELECT id, task_id FROM review_comments ORDER BY id').all() as Array<{
          id: string
          task_id: string
        }>
        expect(comments).toEqual([
          { id: 'R6-4.D.snap-comment-1', task_id: 'R6-4.D.snapshot-task-1' },
        ])

        const meta = readOnly.db.prepare('SELECT name, tagline FROM project_meta WHERE id = 1').get() as {
          name: string
          tagline: string | null
        }
        expect(meta).toEqual({
          name: 'snapshot-e2e-project',
          tagline: 'End-to-end migration fixture',
        })
      } finally {
        readOnly.close()
      }

      // 2. The drifted canonical file has been restored from template
      const templateContent = await readFile(
        join(__dirname, '../../templates/docs/core/alignment.md'),
        'utf-8',
      )
      const restoredContent = await readFile(
        join(projectDir, 'docs', 'core', 'alignment.md'),
        'utf-8',
      )
      expect(restoredContent).toBe(templateContent)

      // 3. .gitignore has the line
      const gitignore = await readFile(join(projectDir, '.gitignore'), 'utf-8')
      expect(gitignore).toContain('docs/.blueprint/tasks.db')

      // 4. project-progress.md retains its user-owned content
      //    (it's in EDITABLE_PROJECT_DOCS — Doctor does not rewrite user docs)
      const progressDoc = await readFile(
        join(projectDir, 'docs', 'project-progress.md'),
        'utf-8',
      )
      expect(progressDoc).toContain('migration-e2e-fixture')
    })
  })

  describe('R6-4.D.2 idempotency', () => {
    it('T-R6-4.D.2.1: second and third Doctor runs on migrated fixture yield isClean === true', async () => {
      const projectDir = await makeProjectDir('blueprint-r6-e2e-idempotent')
      await writePreR6EndToEndProject(projectDir)
      await writeSnapshotAtomic(projectDir, sampleSnapshot())

      // First audit + repair
      const firstAudit = await runDoctorAudit(projectDir)
      expect(firstAudit.isClean).toBe(false)

      const repairPlan = await createRepairPlan(firstAudit.findings, projectDir)
      const repairResult = await executeRepairs(repairPlan.actions, projectDir)
      expect(repairResult.success).toBe(true)

      // Second audit: should be clean
      const secondAudit = await runDoctorAudit(projectDir)
      expect(secondAudit.isClean).toBe(true)
      expect(secondAudit.findings).toEqual([])

      // Third audit: still clean (no state drift from repeated invocations)
      const thirdAudit = await runDoctorAudit(projectDir)
      expect(thirdAudit.isClean).toBe(true)
      expect(thirdAudit.findings).toEqual([])
    })
  })
})