import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

import { applySchema, type TrackerDatabase } from './schema'

const nodeRequire = createRequire(__filename)
const { DatabaseSync } = nodeRequire('node:sqlite') as typeof import('node:sqlite')

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

  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  applySchema(db)

  return {
    db,
    path: dbPath,
    close() {
      db.close()
    },
  }
}
