import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import BetterSqlite3 from 'better-sqlite3'

import { applySchema, type TrackerDatabase } from './schema'

export interface TrackerDbHandle {
  db: TrackerDatabase
  path: string
  close(): void
}

export function trackerDbPath(projectRoot: string): string {
  return join(resolve(projectRoot), 'docs', '.blueprint', 'tasks.db')
}

export function openDb(projectRoot: string): TrackerDbHandle {
  const dbPath = trackerDbPath(projectRoot)
  mkdirSync(join(resolve(projectRoot), 'docs', '.blueprint'), { recursive: true })

  const db = new BetterSqlite3(dbPath)
  db.pragma('foreign_keys = ON')
  applySchema(db)

  return {
    db,
    path: dbPath,
    close() {
      db.close()
    },
  }
}
