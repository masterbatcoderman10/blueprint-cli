import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import {
  createMissingTrackerDbFinding,
  createTrackerDbDriftFinding,
} from '../../../src/doctor/findings'
import { ensureTrackerDbIgnored } from '../../../src/doctor/gitignore'
import { renderDoctorReport } from '../../../src/doctor/report'
import {
  type TrackerSnapshot,
  SnapshotReadError,
  importSnapshot,
  readSnapshot,
  serializeSnapshot,
  writeSnapshotAtomic,
} from '../../../src/tracker/export'
import {
  getUserVersion,
  openDb,
  openDbReadOnly,
  runIntegrityCheck,
  trackerDbPath,
} from '../../../src/tracker/db'
import { TRACKER_SCHEMA_VERSION, applySchema } from '../../../src/tracker/schema'
import { parseProjectMetaFromProgress, seedProjectMeta } from '../../../src/tracker/project-meta'

type TestDatabase = import('better-sqlite3').Database

const tempRoots: string[] = []

function openMemoryDb(): TestDatabase {
  const db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')
  applySchema(db)
  return db
}

async function makeProjectRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix))
  tempRoots.push(root)
  await mkdir(join(root, 'docs', '.blueprint'), { recursive: true })
  return root
}

function sampleSnapshot(): TrackerSnapshot {
  return {
    tasks: [
      {
        id: 'R6-4.0.2',
        title: 'Serialize snapshot',
        description: 'Build snapshot helpers',
        state: 'IN-PROGRESS',
        phase: 'Phase 4',
        stream: '0',
        author: 'Codex',
        implementation_notes: 'Round-trip coverage',
        created_at: 10,
        updated_at: 11,
      },
    ],
    comments: [
      {
        id: 'comment-1',
        task_id: 'R6-4.0.2',
        parent_id: null,
        severity: 'MAJOR',
        body: 'Verify snapshot shape.',
        author: 'Reviewer',
        line: null,
        created_at: 12,
        updated_at: 13,
      },
    ],
    meta: {
      id: 1,
      name: 'blueprint-cli',
      tagline: 'Structured delivery',
      phase_count: null,
      stream_count: null,
      created_at: 1,
      updated_at: 2,
    },
  }
}

function insertSampleRows(db: TestDatabase): void {
  db.prepare(
    `INSERT INTO tasks
      (id, title, description, state, phase, stream, author, implementation_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'R6-4.0.2',
    'Serialize snapshot',
    'Build snapshot helpers',
    'IN-PROGRESS',
    'Phase 4',
    '0',
    'Codex',
    'Round-trip coverage',
    10,
    11,
  )
  db.prepare(
    `INSERT INTO review_comments
      (id, task_id, parent_id, severity, body, author, line, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('comment-1', 'R6-4.0.2', null, 'MAJOR', 'Verify snapshot shape.', 'Reviewer', null, 12, 13)
  db.prepare(
    `INSERT INTO project_meta
      (id, name, tagline, phase_count, stream_count, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)`,
  ).run('blueprint-cli', 'Structured delivery', null, null, 1, 2)
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Gate R6-4.0 — migration foundation', () => {
  describe('R6-4.0.1 findings', () => {
    it('T-R6-4.0.1.1: createMissingTrackerDbFinding returns a repairable missing-tracker-db finding', () => {
      const finding = createMissingTrackerDbFinding('docs/.blueprint/tasks.db')

      expect(finding).toMatchObject({
        kind: 'missing-tracker-db',
        targetPath: 'docs/.blueprint/tasks.db',
        repairable: true,
      })
      expect(finding.message).toContain('docs/.blueprint/tasks.db')
    })

    it('T-R6-4.0.1.2: createTrackerDbDriftFinding marks schema-stale findings repairable and names both versions', () => {
      const finding = createTrackerDbDriftFinding({
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'schema-stale',
        observedVersion: 0,
        expectedVersion: TRACKER_SCHEMA_VERSION,
      })

      expect(finding).toMatchObject({
        kind: 'tracker-db-drift',
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'schema-stale',
        repairable: true,
        observedVersion: 0,
        expectedVersion: TRACKER_SCHEMA_VERSION,
      })
      expect(finding.message).toContain('0')
      expect(finding.message).toContain(String(TRACKER_SCHEMA_VERSION))
    })

    it('T-R6-4.0.1.3: createTrackerDbDriftFinding marks integrity failures non-repairable and lists issues verbatim', () => {
      const finding = createTrackerDbDriftFinding({
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'integrity-fail',
        issues: ['row 12 missing child', 'orphaned index entry'],
      })

      expect(finding).toMatchObject({
        kind: 'tracker-db-drift',
        targetPath: 'docs/.blueprint/tasks.db',
        cause: 'integrity-fail',
        repairable: false,
        issues: ['row 12 missing child', 'orphaned index entry'],
      })
      expect(finding.message).toContain('row 12 missing child')
      expect(finding.message).toContain('orphaned index entry')
    })

    it('T-R6-4.0.1.4: renderDoctorReport recognizes the new tracker migration finding kinds', () => {
      const report = renderDoctorReport({
        isClean: false,
        hasBlockingFindings: false,
        findings: [
          createMissingTrackerDbFinding('docs/.blueprint/tasks.db'),
          createTrackerDbDriftFinding({
            targetPath: 'docs/.blueprint/tasks.db',
            cause: 'schema-stale',
            observedVersion: 0,
            expectedVersion: TRACKER_SCHEMA_VERSION,
          }),
        ],
      })

      expect(report).toContain('Tracker database migration required:')
      expect(report).toContain('Tracker database drift detected:')
      expect(report).toContain('docs/.blueprint/tasks.db')
    })
  })

  describe('R6-4.0.2 snapshot helpers', () => {
    it('T-R6-4.0.2.1: serializeSnapshot returns flat task, comment, and meta rows', () => {
      const db = openMemoryDb()
      try {
        insertSampleRows(db)

        expect(serializeSnapshot(db)).toEqual(sampleSnapshot())
      } finally {
        db.close()
      }
    })

    it('T-R6-4.0.2.2: importSnapshot round-trips into serializeSnapshot output', () => {
      const db = openMemoryDb()
      try {
        importSnapshot(db, sampleSnapshot())

        expect(serializeSnapshot(db)).toEqual(sampleSnapshot())
      } finally {
        db.close()
      }
    })

    it('T-R6-4.0.2.3: importSnapshot clears existing rows before inserting replacement data', () => {
      const db = openMemoryDb()
      try {
        insertSampleRows(db)
        const replacement = {
          tasks: [
            {
              ...sampleSnapshot().tasks[0],
              id: 'R6-4.0.2b',
              title: 'Replacement task',
            },
          ],
          comments: [],
          meta: {
            ...sampleSnapshot().meta,
            name: 'replacement-project',
          },
        } satisfies TrackerSnapshot

        importSnapshot(db, replacement)

        const taskIds = db.prepare('SELECT id FROM tasks ORDER BY id').all() as Array<{ id: string }>
        const commentCount = db.prepare('SELECT COUNT(*) AS count FROM review_comments').get() as { count: number }
        const meta = db.prepare('SELECT name FROM project_meta WHERE id = 1').get() as { name: string }
        expect(taskIds).toEqual([{ id: 'R6-4.0.2b' }])
        expect(commentCount.count).toBe(0)
        expect(meta.name).toBe('replacement-project')
      } finally {
        db.close()
      }
    })

    it('T-R6-4.0.2.4: writeSnapshotAtomic writes valid JSON to docs/.blueprint/tasks.export.json', async () => {
      const root = await makeProjectRoot('blueprint-export-write-')
      const snapshot = sampleSnapshot()

      await writeSnapshotAtomic(root, snapshot)

      const snapshotPath = join(root, 'docs', '.blueprint', 'tasks.export.json')
      await expect(access(snapshotPath)).resolves.toBeUndefined()
      const onDisk = JSON.parse(await readFile(snapshotPath, 'utf-8'))
      expect(onDisk).toEqual(snapshot)
    })

    it('T-R6-4.0.2.5: readSnapshot returns parsed snapshots and throws SnapshotReadError on malformed input', async () => {
      const root = await makeProjectRoot('blueprint-export-read-')
      const snapshotPath = join(root, 'docs', '.blueprint', 'tasks.export.json')
      await writeFile(snapshotPath, JSON.stringify(sampleSnapshot()), 'utf-8')

      await expect(readSnapshot(root)).resolves.toEqual(sampleSnapshot())

      await writeFile(snapshotPath, '{"tasks":{},"comments":[],"meta":null}', 'utf-8')
      await expect(readSnapshot(root)).rejects.toBeInstanceOf(SnapshotReadError)
    })
  })

  describe('R6-4.0.3 project meta helpers', () => {
    it('T-R6-4.0.3.1: seedProjectMeta inserts one singleton row and remains idempotent', () => {
      const db = openMemoryDb()
      try {
        seedProjectMeta(db, { name: 'blueprint-cli', tagline: 'Structured delivery' })
        seedProjectMeta(db, { name: 'blueprint-cli', tagline: 'Updated tagline' })

        const rows = db.prepare('SELECT name, tagline FROM project_meta').all() as Array<{
          name: string
          tagline: string
        }>
        expect(rows).toEqual([{ name: 'blueprint-cli', tagline: 'Updated tagline' }])
      } finally {
        db.close()
      }
    })

    it('T-R6-4.0.3.2: parseProjectMetaFromProgress reads name and tagline from project-progress.md', async () => {
      const root = await makeProjectRoot('blueprint-project-meta-')
      await writeFile(
        join(root, 'docs', 'project-progress.md'),
        '# Project Progress\n\n**Project**: blueprint-cli\n**Tagline**: Structured delivery\n**Tracker**: blueprint-cli\n',
        'utf-8',
      )

      await expect(parseProjectMetaFromProgress(root)).resolves.toEqual({
        name: 'blueprint-cli',
        tagline: 'Structured delivery',
      })
    })

    it('T-R6-4.0.3.3: parseProjectMetaFromProgress tolerates current project-progress files without a tagline field', async () => {
      const root = await makeProjectRoot('blueprint-project-meta-fallback-')
      await writeFile(
        join(root, 'docs', 'project-progress.md'),
        '# Project Progress\n\n**Project**: blueprint-cli\n**Tracker**: blueprint-cli\n',
        'utf-8',
      )

      await expect(parseProjectMetaFromProgress(root)).resolves.toEqual({
        name: 'blueprint-cli',
        tagline: '',
      })
    })
  })

  describe('R6-4.0.4 tracker DB gitignore helper', () => {
    it('T-R6-4.0.4.1: ensureTrackerDbIgnored creates .gitignore with a Blueprint section when missing', async () => {
      const root = await makeProjectRoot('blueprint-gitignore-create-')

      await expect(ensureTrackerDbIgnored(root)).resolves.toBe(true)

      const content = await readFile(join(root, '.gitignore'), 'utf-8')
      expect(content).toContain('# Blueprint')
      expect(content).toContain('docs/.blueprint/tasks.db')
    })

    it('T-R6-4.0.4.2: ensureTrackerDbIgnored appends the canonical line once when absent', async () => {
      const root = await makeProjectRoot('blueprint-gitignore-append-')
      await writeFile(join(root, '.gitignore'), '# Existing\nnode_modules/\n', 'utf-8')

      await expect(ensureTrackerDbIgnored(root)).resolves.toBe(true)

      const content = await readFile(join(root, '.gitignore'), 'utf-8')
      expect(content.match(/docs\/\.blueprint\/tasks\.db/g)).toHaveLength(1)
      expect(content).toContain('# Blueprint')
    })

    it('T-R6-4.0.4.3: ensureTrackerDbIgnored is a no-op when the canonical line already exists', async () => {
      const root = await makeProjectRoot('blueprint-gitignore-idempotent-')
      const original = '# Blueprint\ndocs/.blueprint/tasks.db\n'
      await writeFile(join(root, '.gitignore'), original, 'utf-8')

      await expect(ensureTrackerDbIgnored(root)).resolves.toBe(false)
      await expect(readFile(join(root, '.gitignore'), 'utf-8')).resolves.toBe(original)
    })
  })

  describe('R6-4.0.5 tracker DB helpers', () => {
    it('T-R6-4.0.5.1: getUserVersion returns current schema version for openDb and 0 for raw databases', async () => {
      const root = await makeProjectRoot('blueprint-db-version-')
      const handle = openDb(root)

      try {
        expect(getUserVersion(handle.db)).toBe(TRACKER_SCHEMA_VERSION)
      } finally {
        handle.close()
      }

      const rawDb = new BetterSqlite3(join(root, 'raw.db'))
      try {
        expect(getUserVersion(rawDb)).toBe(0)
      } finally {
        rawDb.close()
      }
    })

    it("T-R6-4.0.5.2: runIntegrityCheck returns 'ok' for healthy databases", () => {
      const db = openMemoryDb()
      try {
        expect(runIntegrityCheck(db)).toBe('ok')
      } finally {
        db.close()
      }
    })

    it('T-R6-4.0.5.3: openDbReadOnly observes a stale user_version without auto-migrating it', async () => {
      const root = await makeProjectRoot('blueprint-db-readonly-')
      const rawDb = new BetterSqlite3(trackerDbPath(root))
      rawDb.pragma('user_version = 0')
      rawDb.close()

      const readonly = openDbReadOnly(root)
      try {
        expect(getUserVersion(readonly.db)).toBe(0)
      } finally {
        readonly.close()
      }

      const verify = new BetterSqlite3(trackerDbPath(root))
      try {
        expect(getUserVersion(verify)).toBe(0)
      } finally {
        verify.close()
      }
    })

    it('T-R6-4.0.5.4: openDbReadOnly throws when docs/.blueprint/tasks.db is absent', async () => {
      const root = await makeProjectRoot('blueprint-db-missing-')

      expect(() => openDbReadOnly(root)).toThrow()
    })
  })
})
