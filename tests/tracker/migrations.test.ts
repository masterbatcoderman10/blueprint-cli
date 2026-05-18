import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { normalizePhase, parseMilestoneFromId, runV1ToV2Migration } from '../../src/tracker/migrations'

type TestDatabase = import('better-sqlite3').Database

let db: TestDatabase | undefined

afterEach(() => {
  db?.close()
  db = undefined
})

describe('parseMilestoneFromId', () => {
  it('T-R6-5.0.3.1a: extracts R6 from R6-3.A.1', () => {
    expect(parseMilestoneFromId('R6-3.A.1')).toBe('R6')
  })

  it('T-R6-5.0.3.1b: extracts M1 from M1-2.0.1', () => {
    expect(parseMilestoneFromId('M1-2.0.1')).toBe('M1')
  })

  it('T-R6-5.0.3.1c: extracts R6 from R6-5.0.1', () => {
    expect(parseMilestoneFromId('R6-5.0.1')).toBe('R6')
  })

  it('T-R6-5.0.3.2a: returns null for orphan-task', () => {
    expect(parseMilestoneFromId('orphan-task')).toBeNull()
  })

  it('T-R6-5.0.3.2b: returns null for empty string', () => {
    expect(parseMilestoneFromId('')).toBeNull()
  })

  it('T-R6-5.0.3.2c: returns null for foo-1.A.1 (wrong prefix)', () => {
    expect(parseMilestoneFromId('foo-1.A.1')).toBeNull()
  })

  it('returns null for bare number like 123', () => {
    expect(parseMilestoneFromId('123')).toBeNull()
  })
})

describe('normalizePhase', () => {
  it('T-R6-5.0.3.3: collapses known long-form Phase 4 value', () => {
    expect(normalizePhase('Phase 4 — Migration & Doctor Integration')).toBe('R6-4')
  })

  it('T-R6-5.0.3.4: is identity on short-form R6-4', () => {
    expect(normalizePhase('R6-4')).toBe('R6-4')
  })

  it('is identity on other short-form values', () => {
    expect(normalizePhase('R6-3')).toBe('R6-3')
    expect(normalizePhase('R6-5')).toBe('R6-5')
  })

  it('is identity on unknown long-form value', () => {
    expect(normalizePhase('Phase 99 — Unknown')).toBe('Phase 99 — Unknown')
  })
})

/**
 * Creates a v1 schema DB (without milestone column) for migration testing.
 */
function createV1Database(): TestDatabase {
  db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')

  // Create v1 schema (no milestone column)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE')),
      phase TEXT NOT NULL,
      stream TEXT,
      author TEXT,
      implementation_notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      parent_id TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('MAJOR', 'MINOR')),
      body TEXT NOT NULL,
      author TEXT,
      line TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES review_comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_meta (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      name TEXT NOT NULL,
      tagline TEXT,
      phase_count INTEGER,
      stream_count INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);
    CREATE INDEX IF NOT EXISTS idx_tasks_phase_stream ON tasks(phase, stream);
    CREATE INDEX IF NOT EXISTS idx_review_comments_task_id ON review_comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id ON review_comments(parent_id);
  `)

  db.pragma('user_version = 1')
  return db
}

function insertV1Task(
  database: TestDatabase,
  opts: {
    id: string
    title?: string
    phase?: string
    state?: string
  },
): void {
  const now = Date.now()
  database
    .prepare(
      `INSERT INTO tasks (id, title, description, state, phase, stream, author, implementation_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      opts.id,
      opts.title ?? `Task ${opts.id}`,
      'Description',
      opts.state ?? 'TO-DO',
      opts.phase ?? 'R6-3',
      'A',
      null,
      null,
      now,
      now,
    )
}

describe('v1 → v2 migration', () => {
  it('T-R6-5.0.4.1: backfills milestone on every row from ID prefix', () => {
    const database = createV1Database()
    insertV1Task(database, { id: 'R6-3.A.1', phase: 'R6-3' })
    insertV1Task(database, { id: 'M1-2.0.1', phase: 'M1-2' })

    runV1ToV2Migration(database)

    const rows = database.prepare('SELECT id, milestone FROM tasks ORDER BY id').all() as Array<{
      id: string
      milestone: string
    }>
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: 'M1-2.0.1', milestone: 'M1' })
    expect(rows[1]).toMatchObject({ id: 'R6-3.A.1', milestone: 'R6' })

    // Verify no null milestones
    const nullCount = database
      .prepare('SELECT COUNT(*) as cnt FROM tasks WHERE milestone IS NULL')
      .get() as { cnt: number }
    expect(nullCount.cnt).toBe(0)

    // Verify user_version is 2
    const version = database.pragma('user_version', { simple: true }) as number
    expect(version).toBe(2)
  })

  it('T-R6-5.0.4.2: normalizes legacy long-form phase alongside milestone backfill', () => {
    const database = createV1Database()
    insertV1Task(database, {
      id: 'R6-4.0.1',
      phase: 'Phase 4 — Migration & Doctor Integration',
    })

    runV1ToV2Migration(database)

    const row = database.prepare('SELECT phase, milestone FROM tasks WHERE id = ?').get('R6-4.0.1') as {
      phase: string
      milestone: string
    }
    expect(row.phase).toBe('R6-4')
    expect(row.milestone).toBe('R6')
  })

  it('T-R6-5.0.4.3: idempotent on a v2 DB (no-op)', () => {
    const database = createV1Database()
    insertV1Task(database, { id: 'R6-3.A.1', phase: 'R6-3' })

    // Run migration once
    runV1ToV2Migration(database)
    expect(database.pragma('user_version', { simple: true })).toBe(2)

    // Capture row data after first migration
    const rowAfterFirst = database.prepare('SELECT * FROM tasks WHERE id = ?').get('R6-3.A.1')

    // Run migration again (should be no-op)
    runV1ToV2Migration(database)
    expect(database.pragma('user_version', { simple: true })).toBe(2)

    // Verify no mutation
    const rowAfterSecond = database.prepare('SELECT * FROM tasks WHERE id = ?').get('R6-3.A.1')
    expect(rowAfterSecond).toEqual(rowAfterFirst)
  })

  it('is a no-op on a v0 (fresh) DB', () => {
    const database = new BetterSqlite3(':memory:')
    db = database
    database.pragma('foreign_keys = ON')

    // Fresh DB has user_version = 0
    expect(database.pragma('user_version', { simple: true })).toBe(0)

    // Migration should be a no-op (fresh DB gets v2 schema from CREATE TABLE IF NOT EXISTS)
    expect(() => runV1ToV2Migration(database)).not.toThrow()
    expect(database.pragma('user_version', { simple: true })).toBe(0)
  })

  it('T-R6-5.0.4.4: aborts atomically when a row ID cannot be parsed', () => {
    const database = createV1Database()
    insertV1Task(database, { id: 'R6-3.A.1', phase: 'R6-3' })
    insertV1Task(database, { id: 'orphan-task', phase: 'R6-3' })

    expect(() => runV1ToV2Migration(database)).toThrow(
      /orphan-task/,
    )

    // user_version should still be 1 (rolled back)
    const version = database.pragma('user_version', { simple: true }) as number
    expect(version).toBe(1)

    // milestone column should not exist (rolled back)
    const columns = database
      .pragma('table_info(tasks)') as Array<{ name: string }>
    expect(columns.find((c) => c.name === 'milestone')).toBeUndefined()
  })

  it('creates milestone NOT NULL constraint after migration', () => {
    const database = createV1Database()
    insertV1Task(database, { id: 'R6-3.A.1', phase: 'R6-3' })

    runV1ToV2Migration(database)

    const columns = database
      .pragma('table_info(tasks)') as Array<{ name: string; notnull: number }>
    const milestoneCol = columns.find((c) => c.name === 'milestone')
    expect(milestoneCol).toBeDefined()
    expect(milestoneCol!.notnull).toBe(1)
  })

  it('creates idx_tasks_milestone and idx_tasks_milestone_phase indexes', () => {
    const database = createV1Database()
    insertV1Task(database, { id: 'R6-3.A.1', phase: 'R6-3' })

    runV1ToV2Migration(database)

    const indexes = database
      .pragma('index_list(tasks)') as Array<{ name: string }>
    const indexNames = indexes.map((i) => i.name)
    expect(indexNames).toContain('idx_tasks_milestone')
    expect(indexNames).toContain('idx_tasks_milestone_phase')
  })

  it('preserves all existing data through migration', () => {
    const database = createV1Database()
    insertV1Task(database, {
      id: 'R6-3.A.1',
      title: 'My Special Task',
      phase: 'R6-3',
      state: 'IN-PROGRESS',
    })

    runV1ToV2Migration(database)

    const row = database.prepare('SELECT * FROM tasks WHERE id = ?').get('R6-3.A.1') as Record<
      string,
      unknown
    >
    expect(row.id).toBe('R6-3.A.1')
    expect(row.title).toBe('My Special Task')
    expect(row.state).toBe('IN-PROGRESS')
    expect(row.phase).toBe('R6-3')
    expect(row.milestone).toBe('R6')
  })
})
