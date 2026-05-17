import type { TrackerDatabase } from '../schema'
import {
  TASK_STATES,
  type CreateTaskInput,
  type Result,
  type Task,
  type TaskError,
  type TaskFilter,
  type TaskState,
  type UpdateTaskInput,
} from '../types'

interface TaskRow {
  id: string
  title: string
  description: string
  state: string
  phase: string
  stream: string | null
  author: string | null
  implementation_notes: string | null
  created_at: number
  updated_at: number
}

type TaskResult<TData> = Result<TData, TaskError>

function isTaskState(value: string): value is TaskState {
  return (TASK_STATES as readonly string[]).includes(value)
}

function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    state: row.state as TaskState,
    phase: row.phase,
    stream: row.stream,
    author: row.author,
    implementation_notes: row.implementation_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function invalidState(state: string): TaskResult<never> {
  return {
    ok: false,
    error: {
      code: 'invalid_state',
      message: `Invalid task state '${state}'. Expected one of: ${TASK_STATES.join(', ')}.`,
    },
  }
}

function duplicateId(id: string): TaskResult<never> {
  return {
    ok: false,
    error: {
      code: 'duplicate_id',
      message: `Task '${id}' already exists.`,
    },
  }
}

function taskNotFound(id: string): TaskResult<never> {
  return {
    ok: false,
    error: {
      code: 'task_not_found',
      message: `Task '${id}' was not found.`,
    },
  }
}

function selectTask(db: TrackerDatabase, id: string): Task | undefined {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
  return row ? taskFromRow(row) : undefined
}

export function createTask(db: TrackerDatabase, input: CreateTaskInput): TaskResult<Task> {
  if (!isTaskState(input.state)) {
    return invalidState(input.state)
  }

  if (selectTask(db, input.id)) {
    return duplicateId(input.id)
  }

  const now = input.now ?? Date.now()
  db.prepare(
    `INSERT INTO tasks (
      id,
      title,
      description,
      state,
      phase,
      stream,
      author,
      implementation_notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.title,
    input.description,
    input.state,
    input.phase,
    input.stream ?? null,
    input.author ?? null,
    input.implementation_notes ?? null,
    now,
    now,
  )

  const task = selectTask(db, input.id)
  if (!task) {
    return taskNotFound(input.id)
  }

  return { ok: true, data: task }
}

export function getTask(db: TrackerDatabase, input: { id: string }): TaskResult<Task> {
  const task = selectTask(db, input.id)
  return task ? { ok: true, data: task } : taskNotFound(input.id)
}

export function listTasks(db: TrackerDatabase, filter: TaskFilter = {}): TaskResult<Task[]> {
  const where: string[] = []
  const values: string[] = []

  if (filter.phase !== undefined) {
    where.push('phase = ?')
    values.push(filter.phase)
  }

  if (filter.stream !== undefined) {
    where.push('stream = ?')
    values.push(filter.stream)
  }

  const sql = `SELECT * FROM tasks${where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at, id`
  const rows = db.prepare(sql).all(...values) as unknown as TaskRow[]
  return { ok: true, data: rows.map(taskFromRow) }
}

export function updateTask(db: TrackerDatabase, input: UpdateTaskInput): TaskResult<Task> {
  const existing = selectTask(db, input.id)
  if (!existing) {
    return taskNotFound(input.id)
  }

  if (input.state !== undefined && !isTaskState(input.state)) {
    return invalidState(input.state)
  }

  const updatedAt = input.now ?? Date.now()
  db.prepare(
    `UPDATE tasks
      SET title = ?,
          description = ?,
          state = ?,
          phase = ?,
          stream = ?,
          author = ?,
          implementation_notes = ?,
          updated_at = ?
      WHERE id = ?`,
  ).run(
    input.title ?? existing.title,
    input.description ?? existing.description,
    input.state ?? existing.state,
    input.phase ?? existing.phase,
    input.stream === undefined ? existing.stream : input.stream,
    input.author === undefined ? existing.author : input.author,
    input.implementation_notes === undefined ? existing.implementation_notes : input.implementation_notes,
    updatedAt,
    input.id,
  )

  const task = selectTask(db, input.id)
  if (!task) {
    return taskNotFound(input.id)
  }

  return { ok: true, data: task }
}

export function deleteTask(db: TrackerDatabase, input: { id: string }): TaskResult<{ id: string }> {
  const existing = selectTask(db, input.id)
  if (!existing) {
    return taskNotFound(input.id)
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(input.id)
  return { ok: true, data: { id: input.id } }
}
