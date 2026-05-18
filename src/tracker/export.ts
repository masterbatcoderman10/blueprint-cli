import { readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ReviewComment, Task } from './types'
import type { TrackerDatabase } from './schema'

export interface ProjectMetaSnapshot {
  id: number
  name: string
  tagline: string | null
  phase_count: number | null
  stream_count: number | null
  created_at: number
  updated_at: number
}

export interface TrackerSnapshot {
  tasks: Task[]
  comments: ReviewComment[]
  meta: ProjectMetaSnapshot | null
}

export class SnapshotReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SnapshotReadError'
  }
}

function snapshotPath(projectRoot: string): string {
  return join(projectRoot, 'docs', '.blueprint', 'tasks.export.json')
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false
  }

  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    typeof task.state === 'string' &&
    typeof task.phase === 'string' &&
    (typeof task.stream === 'string' || task.stream === null) &&
    (typeof task.author === 'string' || task.author === null) &&
    (typeof task.implementation_notes === 'string' || task.implementation_notes === null) &&
    typeof task.created_at === 'number' &&
    typeof task.updated_at === 'number'
  )
}

function isComment(value: unknown): value is ReviewComment {
  if (!value || typeof value !== 'object') {
    return false
  }

  const comment = value as Record<string, unknown>
  return (
    typeof comment.id === 'string' &&
    typeof comment.task_id === 'string' &&
    (typeof comment.parent_id === 'string' || comment.parent_id === null) &&
    (comment.severity === 'MAJOR' || comment.severity === 'MINOR') &&
    typeof comment.body === 'string' &&
    (typeof comment.author === 'string' || comment.author === null) &&
    (typeof comment.line === 'string' || comment.line === null) &&
    typeof comment.created_at === 'number' &&
    typeof comment.updated_at === 'number'
  )
}

function isProjectMeta(value: unknown): value is ProjectMetaSnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const meta = value as Record<string, unknown>
  return (
    meta.id === 1 &&
    typeof meta.name === 'string' &&
    (typeof meta.tagline === 'string' || meta.tagline === null) &&
    (typeof meta.phase_count === 'number' || meta.phase_count === null) &&
    (typeof meta.stream_count === 'number' || meta.stream_count === null) &&
    typeof meta.created_at === 'number' &&
    typeof meta.updated_at === 'number'
  )
}

function assertSnapshot(value: unknown): TrackerSnapshot {
  if (!value || typeof value !== 'object') {
    throw new SnapshotReadError('Tracker snapshot must be a JSON object.')
  }

  const snapshot = value as Record<string, unknown>
  if (!Array.isArray(snapshot.tasks) || !snapshot.tasks.every(isTask)) {
    throw new SnapshotReadError('Tracker snapshot tasks payload is invalid.')
  }
  if (!Array.isArray(snapshot.comments) || !snapshot.comments.every(isComment)) {
    throw new SnapshotReadError('Tracker snapshot comments payload is invalid.')
  }
  if (!(snapshot.meta === null || isProjectMeta(snapshot.meta))) {
    throw new SnapshotReadError('Tracker snapshot project_meta payload is invalid.')
  }

  return {
    tasks: snapshot.tasks,
    comments: snapshot.comments,
    meta: snapshot.meta,
  }
}

export function serializeSnapshot(db: TrackerDatabase): TrackerSnapshot {
  return {
    tasks: db.prepare('SELECT * FROM tasks ORDER BY created_at, id').all() as Task[],
    comments: db.prepare('SELECT * FROM review_comments ORDER BY created_at, id').all() as ReviewComment[],
    meta: (db.prepare('SELECT * FROM project_meta WHERE id = 1').get() as ProjectMetaSnapshot | undefined) ?? null,
  }
}

export function importSnapshot(db: TrackerDatabase, snapshot: TrackerSnapshot): void {
  const importTransaction = db.transaction((data: TrackerSnapshot) => {
    db.prepare('DELETE FROM review_comments').run()
    db.prepare('DELETE FROM tasks').run()
    db.prepare('DELETE FROM project_meta').run()

    for (const task of data.tasks) {
      db.prepare(
        `INSERT INTO tasks
          (id, title, description, state, phase, stream, author, implementation_notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        task.id,
        task.title,
        task.description,
        task.state,
        task.phase,
        task.stream,
        task.author,
        task.implementation_notes,
        task.created_at,
        task.updated_at,
      )
    }

    for (const comment of data.comments) {
      db.prepare(
        `INSERT INTO review_comments
          (id, task_id, parent_id, severity, body, author, line, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        comment.id,
        comment.task_id,
        comment.parent_id,
        comment.severity,
        comment.body,
        comment.author,
        comment.line,
        comment.created_at,
        comment.updated_at,
      )
    }

    if (data.meta) {
      db.prepare(
        `INSERT INTO project_meta
          (id, name, tagline, phase_count, stream_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        data.meta.id,
        data.meta.name,
        data.meta.tagline,
        data.meta.phase_count,
        data.meta.stream_count,
        data.meta.created_at,
        data.meta.updated_at,
      )
    }
  })

  importTransaction(snapshot)
}

export async function writeSnapshotAtomic(projectRoot: string, snapshot: TrackerSnapshot): Promise<void> {
  const targetPath = snapshotPath(projectRoot)
  const tempPath = `${targetPath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8')
  await rename(tempPath, targetPath)
}

export async function readSnapshot(projectRoot: string): Promise<TrackerSnapshot> {
  let raw: string
  try {
    raw = await readFile(snapshotPath(projectRoot), 'utf-8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown snapshot read error'
    throw new SnapshotReadError(message)
  }

  try {
    return assertSnapshot(JSON.parse(raw) as unknown)
  } catch (error) {
    if (error instanceof SnapshotReadError) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown snapshot parse error'
    throw new SnapshotReadError(message)
  }
}
