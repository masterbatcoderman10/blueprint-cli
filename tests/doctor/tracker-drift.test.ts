import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { auditTrackerSchema, runDoctorAudit } from '../../src/doctor/audit'
import { createRepairPlan, renderRepairPlan } from '../../src/doctor/repair'
import { TRACKER_SCHEMA_VERSION } from '../../src/tracker/schema'
import { getUserVersion, openDb, openDbReadOnly, runIntegrityCheck, trackerDbPath } from '../../src/tracker/db'
import { writeCanonicalProject } from '../phase-3/stream-b/test-project'

const tempDirs: string[] = []

async function makeProjectDir(name: string): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), `${name}-`))
  tempDirs.push(projectDir)
  return projectDir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('Stream C — doctor schema & integrity check', () => {
  describe('R6-4.C.1 auditTrackerSchema', () => {
    it('T-R6-4.C.1.1: DB with user_version=0 emits schema-stale drift finding', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c1-stale')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-audit-test\n**Tagline**: Schema stale fixture\n',
        },
      })

      // Create a stale DB (user_version=0) using raw better-sqlite3 — not openDb
      const dbPath = trackerDbPath(projectDir)
      const rawDb = new BetterSqlite3(dbPath)
      rawDb.exec(`
        CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY);
      `)
      rawDb.pragma('user_version = 0')
      rawDb.close()

      const findings = await auditTrackerSchema(projectDir)

      expect(findings).toHaveLength(1)
      const finding = findings[0]
      expect(finding).toMatchObject({
        kind: 'tracker-db-drift',
        cause: 'schema-stale',
        repairable: true,
        observedVersion: 0,
        expectedVersion: TRACKER_SCHEMA_VERSION,
      })
    })

    it('T-R6-4.C.1.2: audit does not auto-migrate stale DB (user_version stays 0)', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c1-no-migrate')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-audit-no-migrate\n**Tagline**: No auto-migrate fixture\n',
        },
      })

      const dbPath = trackerDbPath(projectDir)
      const rawDb = new BetterSqlite3(dbPath)
      rawDb.exec(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY);`)
      rawDb.pragma('user_version = 0')
      rawDb.close()

      // Run audit
      await auditTrackerSchema(projectDir)

      // Verify on-disk user_version is still 0 (not auto-migrated)
      const verify = new BetterSqlite3(dbPath)
      const version = verify.pragma('user_version', { simple: true }) as number
      verify.close()
      expect(version).toBe(0)
    })

    it('T-R6-4.C.1.3: corrupted DB emits integrity-fail finding', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c1-corrupted')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-audit-corrupt\n**Tagline**: Corrupted fixture\n',
        },
      })

      const dbPath = trackerDbPath(projectDir)
      // Write garbage bytes to simulate a corrupted DB
      await writeFile(dbPath, Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]), 'binary')

      const findings = await auditTrackerSchema(projectDir)

      expect(findings.length).toBeGreaterThanOrEqual(1)
      const integrityFinding = findings.find(
        (f) => f.kind === 'tracker-db-drift' && f.cause === 'integrity-fail',
      )
      expect(integrityFinding).toBeDefined()
      expect(integrityFinding).toMatchObject({
        kind: 'tracker-db-drift',
        cause: 'integrity-fail',
        repairable: false,
      })
      if (integrityFinding && integrityFinding.kind === 'tracker-db-drift' && integrityFinding.cause === 'integrity-fail') {
        expect(integrityFinding.issues).toBeDefined()
        expect(integrityFinding.issues!.length).toBeGreaterThan(0)
      }
    })

    it('T-R6-4.C.1.4: healthy DB at current version with clean integrity emits no drift findings', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c1-healthy')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-audit-healthy\n**Tagline**: Healthy DB fixture\n',
        },
      })

      // Create a fully healthy DB via openDb
      const handle = openDb(projectDir)
      handle.close()

      const findings = await auditTrackerSchema(projectDir)
      expect(findings).toHaveLength(0)
    })

    it('T-R6-4.C.1.5: DB simultaneously stale and integrity-failing emits BOTH findings', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c1-both')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-audit-both\n**Tagline**: Both findings fixture\n',
        },
      })

      // Create a valid DB with user_version=0 (schema-stale), then break
      // integrity by overwriting bytes in the page content area (after the header)
      const dbPath = trackerDbPath(projectDir)
      const rawDb = new BetterSqlite3(dbPath)
      rawDb.exec(`CREATE TABLE t (x TEXT); INSERT INTO t VALUES ('hello');`)
      rawDb.pragma('user_version = 0')
      rawDb.close()

      // Corrupt a byte in the page area (offset well past the 100-byte header)
      // to break integrity_check while keeping the file openable and header valid
      const fs = await import('node:fs/promises')
      const buf = Buffer.from(await fs.readFile(dbPath))
      // Overwrite a byte in the first table b-tree page (typically starts around offset 4096)
      // but keep the SQLite header (first 100 bytes) intact
      const corruptOffset = Math.min(buf.length - 1, 4096)
      buf[corruptOffset] = buf[corruptOffset]! ^ 0xff
      await fs.writeFile(dbPath, buf)

      const findings = await auditTrackerSchema(projectDir)

      // Both schema-stale and integrity-fail should be emitted
      const staleFindings = findings.filter(
        (f) => f.kind === 'tracker-db-drift' && f.cause === 'schema-stale',
      )
      const integrityFindings = findings.filter(
        (f) => f.kind === 'tracker-db-drift' && f.cause === 'integrity-fail',
      )
      expect(staleFindings.length).toBeGreaterThanOrEqual(1)
      expect(integrityFindings.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('R6-4.C.2 repair-tracker-db-drift', () => {
    it('T-R6-4.C.2.1: schema-stale repair via createRepairPlan → executeRepairs → re-audit clean', async () => {
      const projectDir = await makeProjectDir('blueprint-r6c2-stale-repair')
      await writeCanonicalProject(projectDir, {
        editableDocs: {
          'docs/project-progress.md':
            '**Project**: drift-repair-test\n**Tagline**: Stale repair fixture\n',
        },
      })

      // Create a stale DB (user_version=0) using raw better-sqlite3
      const dbPath = trackerDbPath(projectDir)
      const rawDb = new BetterSqlite3(dbPath)
      rawDb.pragma('user_version = 0')
      rawDb.close()

      // Verify it's stale
      const preAudit = await auditTrackerSchema(projectDir)
      expect(preAudit.some((f) => f.kind === 'tracker-db-drift' && f.cause === 'schema-stale')).toBe(true)

      // Repair via the full doctor pipeline
      const repairPlan = await createRepairPlan(preAudit, projectDir)
      expect(repairPlan.actions.some((a) => a.type === 'repair-tracker-db-drift')).toBe(true)
      expect(repairPlan.hasBlockingFindings).toBe(false)

      // Execute the repair plan
      const { executeRepairs } = await import('../../src/doctor/executor')
      const repairResult = await executeRepairs(repairPlan.actions, projectDir)
      expect(repairResult.success).toBe(true)

      // Verify user_version is now correct
      const verify = openDbReadOnly(projectDir)
      try {
        expect(getUserVersion(verify.db)).toBe(TRACKER_SCHEMA_VERSION)
      } finally {
        verify.close()
      }

      // Re-audit should be clean
      const postAudit = await auditTrackerSchema(projectDir)
      expect(postAudit).toHaveLength(0)
    })

    it('T-R6-4.C.2.2: createRepairPlan with integrity-fail sets hasBlockingFindings=true and blockingReason', async () => {
      const integrityFinding = {
        kind: 'tracker-db-drift' as const,
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'integrity-fail' as const,
        repairable: false,
        issues: ['database disk image is malformed', 'wrong number of rows in table'],
        message:
          'Tracker database integrity check failed at docs/.blueprint/tasks.db: database disk image is malformed; wrong number of rows in table',
      }

      const plan = await createRepairPlan([integrityFinding], '/tmp/fake-project')

      expect(plan.hasBlockingFindings).toBe(true)
      expect(plan.blockingReason).toContain('database disk image is malformed')
      expect(plan.blockingReason).toContain('wrong number of rows in table')
    })

    it('T-R6-4.C.2.3: renderRepairPlan for integrity-fail includes issues verbatim', async () => {
      const integrityFinding = {
        kind: 'tracker-db-drift' as const,
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'integrity-fail' as const,
        repairable: false,
        issues: ['database disk image is malformed', 'orphaned index entry on tasks'],
        message:
          'Tracker database integrity check failed at docs/.blueprint/tasks.db: database disk image is malformed; orphaned index entry on tasks',
      }

      const plan = await createRepairPlan([integrityFinding], '/tmp/fake-project')
      const output = renderRepairPlan(plan)

      expect(plan.hasBlockingFindings).toBe(true)
      expect(output).toContain('database disk image is malformed')
      expect(output).toContain('orphaned index entry on tasks')
      expect(output).toContain('Cannot proceed with repairs')
    })
  })
})