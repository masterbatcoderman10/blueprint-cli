import { describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { TRACKER_SCHEMA_VERSION, applySchema } from '../../src/tracker/schema'

type TestDatabase = import('better-sqlite3').Database

describe('Tracker schema — version 2 assertions', () => {
  function openFreshDb(): TestDatabase {
    const db = new BetterSqlite3(':memory:')
    db.pragma('foreign_keys = ON')
    applySchema(db)
    return db
  }

  it('T-R6-5.0.2.1: TRACKER_SCHEMA_VERSION constant equals 2', () => {
    expect(TRACKER_SCHEMA_VERSION).toBe(2)
  })

  it('T-R6-5.0.2.2: fresh applySchema() on empty DB produces tasks.milestone column with NOT NULL constraint', () => {
    const db = openFreshDb()

    const columns = db.pragma('table_info(tasks)') as Array<{
      name: string
      type: string
      notnull: number
      dflt_value: unknown
      pk: number
    }>

    const milestoneCol = columns.find((c) => c.name === 'milestone')
    expect(milestoneCol).toBeDefined()
    expect(milestoneCol!.type).toBe('TEXT')
    expect(milestoneCol!.notnull).toBe(1)

    db.close()
  })

  it('T-R6-5.0.2.3: fresh applySchema() creates idx_tasks_milestone and idx_tasks_milestone_phase', () => {
    const db = openFreshDb()

    const indexes = db.pragma('index_list(tasks)') as Array<{
      name: string
      unique: number
      origin: string
      partial: number
    }>

    const indexNames = indexes.map((i) => i.name)
    expect(indexNames).toContain('idx_tasks_milestone')
    expect(indexNames).toContain('idx_tasks_milestone_phase')

    db.close()
  })

  it('fresh applySchema() sets user_version to 2', () => {
    const db = openFreshDb()

    const version = db.pragma('user_version', { simple: true }) as number
    expect(version).toBe(2)

    db.close()
  })

  it('all original schema elements still exist', () => {
    const db = openFreshDb()

    // Check tasks table columns
    const taskColumns = db.pragma('table_info(tasks)') as Array<{ name: string }>
    const taskColNames = taskColumns.map((c) => c.name)
    expect(taskColNames).toContain('id')
    expect(taskColNames).toContain('title')
    expect(taskColNames).toContain('description')
    expect(taskColNames).toContain('state')
    expect(taskColNames).toContain('phase')
    expect(taskColNames).toContain('stream')
    expect(taskColNames).toContain('author')
    expect(taskColNames).toContain('implementation_notes')
    expect(taskColNames).toContain('milestone')
    expect(taskColNames).toContain('created_at')
    expect(taskColNames).toContain('updated_at')

    // Check review_comments table exists
    const commentTables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='review_comments'")
      .all() as Array<{ name: string }>
    expect(commentTables).toHaveLength(1)

    // Check project_meta table exists
    const metaTables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_meta'")
      .all() as Array<{ name: string }>
    expect(metaTables).toHaveLength(1)

    // Check original indexes
    const indexes = db.pragma('index_list(tasks)') as Array<{ name: string }>
    const indexNames = indexes.map((i) => i.name)
    expect(indexNames).toContain('idx_tasks_state')
    expect(indexNames).toContain('idx_tasks_phase_stream')

    db.close()
  })
})
