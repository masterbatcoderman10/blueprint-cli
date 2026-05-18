import type { TrackerDatabase } from './schema'

/**
 * Extracts the milestone prefix from a task ID.
 * Matches patterns like 'R6-3.A.1' → 'R6', 'M1-2.0.1' → 'M1'.
 * Also handles bug-task IDs like 'BUG-R6-4-001' → 'R6'.
 * Returns null for IDs that don't match the expected pattern.
 */
export function parseMilestoneFromId(id: string): string | null {
  // Try BUG- prefixed IDs first: BUG-R6-4-001 → R6
  const bugMatch = /^BUG-([MR]\d+)-/.exec(id)
  if (bugMatch) return bugMatch[1]

  // Standard prefix: R6-3.A.1 → R6, M1-2.0.1 → M1
  const match = /^([MR]\d+)-/.exec(id)
  return match ? match[1] : null
}

/**
 * Known long-form phase values and their short-form mappings.
 * Keys are the full long-form strings that appear in existing data.
 */
const KNOWN_LONG_FORM_PHASES: Record<string, string> = {
  'Phase 4 — Migration & Doctor Integration': 'R6-4',
}

/**
 * Normalizes a phase value to its short form.
 * If the phase is already in short form (e.g., 'R6-4'), returns it unchanged.
 * If it matches a known long-form value, returns the corresponding short form.
 *
 * @param phase The phase value to normalize.
 * @param id Optional task ID for context (used for BUG-* IDs that carry milestone info).
 */
export function normalizePhase(phase: string, id?: string): string {
  if (KNOWN_LONG_FORM_PHASES[phase]) {
    return KNOWN_LONG_FORM_PHASES[phase]
  }

  // For BUG-* IDs, try to derive short-form phase from the ID pattern.
  // BUG-R6-4-001 → phase should be R6-4 if the stored phase is long-form or ambiguous.
  if (id) {
    const bugPhaseMatch = /^BUG-([MR]\d+-\d+)-/.exec(id)
    if (bugPhaseMatch && phase !== bugPhaseMatch[1]) {
      // If the current phase doesn't match the ID-derived short form and the
      // stored phase is a long-form that contains the milestone prefix, normalize it.
      const derivedPhase = bugPhaseMatch[1]
      const milestone = parseMilestoneFromId(id)
      if (milestone && phase.includes(milestone)) {
        return derivedPhase
      }
    }
  }

  return phase
}

/**
 * Runs the v1 → v2 schema migration.
 * - Adds milestone column (nullable initially for backfill)
 * - Backfills milestone from task IDs
 * - Normalizes legacy long-form phase values
 * - Recreates table with milestone NOT NULL constraint
 * - Sets user_version = 2
 *
 * Idempotent: no-op if user_version is already >= 2.
 * Throws on rows whose IDs don't match the expected prefix pattern.
 */
export function runV1ToV2Migration(db: TrackerDatabase): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number

  // No-op if already at v2 or if DB is fresh (v0) — fresh DBs get v2 schema directly from applySchema
  if (currentVersion !== 1) {
    return
  }

  // Disable foreign keys BEFORE the transaction to prevent CASCADE deletion
  // of review_comments during the DROP TABLE tasks step. SQLite does not allow
  // changing this pragma inside a transaction.
  db.pragma('foreign_keys = OFF')

  const transaction = db.transaction(() => {
    // Step (a): Add milestone column without NOT NULL constraint
    db.exec('ALTER TABLE tasks ADD COLUMN milestone TEXT')

    // Step (b) + (c) + (d): Backfill milestone and normalize phase
    const rows = db.prepare('SELECT id, phase, milestone FROM tasks').all() as Array<{
      id: string
      phase: string
      milestone: string | null
    }>

    const badIds: string[] = []
    const updateStmt = db.prepare('UPDATE tasks SET milestone = ?, phase = ? WHERE id = ?')

    for (const row of rows) {
      const milestone = parseMilestoneFromId(row.id)
      if (milestone === null) {
        badIds.push(row.id)
        continue
      }
      const normalizedPhase = normalizePhase(row.phase, row.id)
      updateStmt.run(milestone, normalizedPhase, row.id)
    }

    if (badIds.length > 0) {
      throw new Error(
        `Cannot migrate: ${badIds.length} task(s) have IDs that don't match the expected patterns. ` +
          `Manual fix required for: ${badIds.join(', ')}`,
      )
    }

    // Step (e): Recreate table with milestone NOT NULL constraint via copy-rename
    db.exec(`
      CREATE TABLE tasks_new (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE')),
        phase TEXT NOT NULL,
        stream TEXT,
        author TEXT,
        implementation_notes TEXT,
        milestone TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)

    db.exec(`
      INSERT INTO tasks_new
        (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
      SELECT
        id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at
      FROM tasks;
    `)

    db.exec('DROP TABLE tasks;')
    db.exec('ALTER TABLE tasks_new RENAME TO tasks;')

    // Recreate indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);')
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_phase_stream ON tasks(phase, stream);')
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone);')
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_milestone_phase ON tasks(milestone, phase);')
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_review_comments_task_id ON review_comments(task_id);',
    )
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id ON review_comments(parent_id);',
    )

    // Step (f): Set user_version = 2
    db.pragma('user_version = 2')
  })

  try {
    transaction()
  } finally {
    // Always re-enable foreign keys, even if the migration threw an error
    // (rollback still happens, so the DB is consistent, but FK must be restored)
    db.pragma('foreign_keys = ON')
  }
}
