import BetterSqlite3 from 'better-sqlite3'

import { runV1ToV2Migration } from './migrations'

export type TrackerDatabase = InstanceType<typeof BetterSqlite3>

export const TRACKER_SCHEMA_VERSION = 2

export function applySchema(db: TrackerDatabase): void {
  // Run migrations before creating schema (idempotent on fresh/current-version DBs)
  runV1ToV2Migration(db)

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
      milestone TEXT NOT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone);
    CREATE INDEX IF NOT EXISTS idx_tasks_milestone_phase ON tasks(milestone, phase);
    CREATE INDEX IF NOT EXISTS idx_review_comments_task_id ON review_comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id ON review_comments(parent_id);
  `)

  db.pragma(`user_version = ${TRACKER_SCHEMA_VERSION}`)
}
