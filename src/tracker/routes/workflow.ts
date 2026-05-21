import type { TrackerDatabase } from '../schema'
import type { JsonObject, Result, Task, WorkflowError, WorkflowResult } from '../types'
import { runWorkflowTransaction } from '../transaction'
import { validateTransition } from '../validator'

function taskNotFound(id: string): { ok: false; error: WorkflowError } {
  return {
    ok: false,
    error: { code: 'task_not_found', message: `Task '${id}' was not found.` },
  }
}

function selectTaskState(db: TrackerDatabase, id: string): { state: string } | undefined {
  return db.prepare('SELECT state FROM tasks WHERE id = ?').get(id) as { state: string } | undefined
}

function selectFullTask(db: TrackerDatabase, id: string): Task | undefined {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined
}

function successResult(data: WorkflowResult): Result<WorkflowResult, WorkflowError> {
  return { ok: true, data }
}

function errorResult(error: WorkflowError): Result<WorkflowResult, WorkflowError> {
  return { ok: false, error }
}

export function workflowStart(
  db: TrackerDatabase,
  taskId: string,
): Result<WorkflowResult, WorkflowError> {
  const task = selectTaskState(db, taskId)
  if (!task) return taskNotFound(taskId)

  const validation = validateTransition('start', task.state)
  if (!validation.ok) return errorResult(validation)

  if (validation.kind === 'noop') {
    const fullTask = selectFullTask(db, taskId)
    if (!fullTask) return taskNotFound(taskId)
    return successResult({ task: fullTask, comments: [] })
  }

  return runWorkflowTransaction(db, taskId, validation.to)
}

export function workflowSubmit(
  db: TrackerDatabase,
  taskId: string,
): Result<WorkflowResult, WorkflowError> {
  const task = selectTaskState(db, taskId)
  if (!task) return taskNotFound(taskId)

  const validation = validateTransition('submit', task.state)
  if (!validation.ok) return errorResult(validation)

  if (validation.kind === 'noop') {
    const fullTask = selectFullTask(db, taskId)
    if (!fullTask) return taskNotFound(taskId)
    return successResult({ task: fullTask, comments: [] })
  }

  return runWorkflowTransaction(db, taskId, validation.to)
}

export function workflowResume(
  db: TrackerDatabase,
  taskId: string,
): Result<WorkflowResult, WorkflowError> {
  const task = selectTaskState(db, taskId)
  if (!task) return taskNotFound(taskId)

  const validation = validateTransition('resume', task.state)
  if (!validation.ok) return errorResult(validation)

  if (validation.kind === 'noop') {
    const fullTask = selectFullTask(db, taskId)
    if (!fullTask) return taskNotFound(taskId)
    return successResult({ task: fullTask, comments: [] })
  }

  return runWorkflowTransaction(db, taskId, validation.to)
}

export function workflowApprove(
  db: TrackerDatabase,
  taskId: string,
  body: JsonObject | undefined,
): Result<WorkflowResult, WorkflowError> {
  const task = selectTaskState(db, taskId)
  if (!task) return taskNotFound(taskId)

  const validation = validateTransition('approve', task.state)
  if (!validation.ok) return errorResult(validation)

  if (validation.kind === 'noop') {
    const fullTask = selectFullTask(db, taskId)
    if (!fullTask) return taskNotFound(taskId)
    return successResult({ task: fullTask, comments: [] })
  }

  const comments = extractComments(body)
  if (!comments.ok) return comments

  return runWorkflowTransaction(db, taskId, validation.to, comments.data)
}

export function workflowReject(
  db: TrackerDatabase,
  taskId: string,
  body: JsonObject | undefined,
): Result<WorkflowResult, WorkflowError> {
  const task = selectTaskState(db, taskId)
  if (!task) return taskNotFound(taskId)

  const validation = validateTransition('reject', task.state)
  if (!validation.ok) return errorResult(validation)

  if (validation.kind === 'noop') {
    const fullTask = selectFullTask(db, taskId)
    if (!fullTask) return taskNotFound(taskId)
    return successResult({ task: fullTask, comments: [] })
  }

  const comments = extractRequiredComments(body)
  if (!comments.ok) return comments

  return runWorkflowTransaction(db, taskId, validation.to, comments.data)
}

function extractComments(
  body: JsonObject | undefined,
): Result<WorkflowResult['comments'], WorkflowError> {
  if (!body || body.comments === undefined) {
    return { ok: true, data: [] }
  }

  if (!Array.isArray(body.comments)) {
    return {
      ok: false,
      error: { code: 'invalid_comments', message: '`comments` must be an array.' },
    }
  }

  return { ok: true, data: body.comments as WorkflowResult['comments'] }
}

function extractRequiredComments(
  body: JsonObject | undefined,
): Result<WorkflowResult['comments'], WorkflowError> {
  if (!body || body.comments === undefined) {
    return {
      ok: false,
      error: { code: 'invalid_comments', message: '`reject` requires a `comments` array with at least one entry.' },
    }
  }

  if (!Array.isArray(body.comments)) {
    return {
      ok: false,
      error: { code: 'invalid_comments', message: '`comments` must be an array.' },
    }
  }

  if (body.comments.length === 0) {
    return {
      ok: false,
      error: { code: 'invalid_comments', message: '`reject` requires a `comments` array with at least one entry.' },
    }
  }

  return { ok: true, data: body.comments as WorkflowResult['comments'] }
}
