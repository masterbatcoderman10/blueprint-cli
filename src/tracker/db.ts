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

function createHandle(db: TrackerDatabase, path: string): TrackerDbHandle {
  return {
    db,
    path,
    close() {
      db.close()
    },
  }
}

export function openDb(projectRoot: string): TrackerDbHandle {
  const dbPath = trackerDbPath(projectRoot)
  mkdirSync(join(resolve(projectRoot), 'docs', '.blueprint'), { recursive: true })

  const db = new BetterSqlite3(dbPath)
  db.pragma('foreign_keys = ON')
  applySchema(db)

  return createHandle(db, dbPath)
}

export function openDbReadOnly(projectRoot: string): TrackerDbHandle {
  const dbPath = trackerDbPath(projectRoot)
  const db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true })
  db.pragma('foreign_keys = ON')
  return createHandle(db, dbPath)
}

export function getUserVersion(db: TrackerDatabase): number {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number }
  return row.user_version
}

export function runIntegrityCheck(db: TrackerDatabase): 'ok' | string[] {
  const rows = db.prepare('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>
  if (rows.length === 1 && rows[0]?.integrity_check === 'ok') {
    return 'ok'
  }

  return rows.map((row) => row.integrity_check)
}
