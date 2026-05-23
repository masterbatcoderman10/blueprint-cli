import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { openDb, runIntegrityCheck, getUserVersion } from '../../src/tracker/db'
import { TRACKER_SCHEMA_VERSION } from '../../src/tracker/schema'

/**
 * T-R6-5.C.6.1, T-R6-5.C.6.2, T-R6-5.C.6.3
 *
 * Post-migration schema validation on the live project DB.
 * These tests verify the actual docs/.blueprint/tasks.db that ships with the project
 * is in a valid state after the v1→v2 migration.
 */
const PROJECT_ROOT = resolve(__dirname, '../../')

describe('Post-migration schema integrity (C.6)', () => {
  it('T-R6-5.C.6.1: PRAGMA integrity_check returns ok and PRAGMA foreign_key_check returns zero rows', () => {
    const handle = openDb(PROJECT_ROOT)
    try {
      // PRAGMA integrity_check
      const integrityResult = runIntegrityCheck(handle.db)
      expect(integrityResult).toBe('ok')

      // PRAGMA foreign_key_check — must return zero rows (no orphans)
      const fkViolations = handle.db.prepare('PRAGMA foreign_key_check').all() as unknown[]
      expect(fkViolations).toEqual([])
    } finally {
      handle.close()
    }
  })

  it('T-R6-5.C.6.2: TRACKER_SCHEMA_VERSION === 2 and every row has milestone IS NOT NULL', () => {
    const handle = openDb(PROJECT_ROOT)
    try {
      // Schema version
      const userVersion = getUserVersion(handle.db)
      expect(userVersion).toBe(TRACKER_SCHEMA_VERSION)
      expect(userVersion).toBe(2)

      // Every row has milestone IS NOT NULL
      const nullMilestoneRows = handle.db
        .prepare('SELECT id FROM tasks WHERE milestone IS NULL')
        .all() as Array<{ id: string }>
      expect(nullMilestoneRows).toEqual([])

    } finally {
      handle.close()
    }
  })

  it('T-R6-5.C.6.3: Post-migration indexes exist and are valid', () => {
    const handle = openDb(PROJECT_ROOT)
    try {
      // Get all indexes on the tasks table
      const indexList = handle.db
        .prepare('PRAGMA index_list(tasks)')
        .all() as Array<{ name: string; unique: number; origin: string }>

      const indexNames = indexList.map((idx) => idx.name)

      // Verify idx_tasks_milestone exists
      expect(indexNames).toContain('idx_tasks_milestone')

      // Verify idx_tasks_milestone_phase exists
      expect(indexNames).toContain('idx_tasks_milestone_phase')

      // Verify idx_tasks_milestone columns
      const milestoneIdxColumns = handle.db
        .prepare('PRAGMA index_info(idx_tasks_milestone)')
        .all() as Array<{ name: string }>
      expect(milestoneIdxColumns.map((c) => c.name)).toEqual(['milestone'])

      // Verify idx_tasks_milestone_phase columns
      const milestonePhaseIdxColumns = handle.db
        .prepare('PRAGMA index_info(idx_tasks_milestone_phase)')
        .all() as Array<{ name: string }>
      expect(milestonePhaseIdxColumns.map((c) => c.name)).toEqual(['milestone', 'phase'])

      // Also verify the pre-existing indexes are still present
      expect(indexNames).toContain('idx_tasks_state')
      expect(indexNames).toContain('idx_tasks_phase_stream')
    } finally {
      handle.close()
    }
  })
})
