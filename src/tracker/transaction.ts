import { randomUUID } from 'node:crypto'

import type { TrackerDatabase } from './schema'
import type {
  ReviewComment,
  Task,
  WorkflowCommentInput,
  WorkflowError,
  WorkflowResult,
  CommentSeverity,
} from './types'

const VALID_SEVERITIES = new Set<string>(['MAJOR', 'MINOR'])

function isCommentSeverity(value: string | undefined): value is CommentSeverity {
  return value !== undefined && VALID_SEVERITIES.has(value)
}

function validateComment(
  db: TrackerDatabase,
  taskId: string,
  input: WorkflowCommentInput,
): WorkflowError | undefined {
  if (!isCommentSeverity(input.severity)) {
    return {
      code: 'invalid_severity',
      message: 'Comment severity must be MAJOR or MINOR.',
    }
  }

  if (input.parent_id) {
    const parent = db
      .prepare('SELECT task_id FROM review_comments WHERE id = ?')
      .get(input.parent_id) as { task_id: string } | undefined

    if (!parent || parent.task_id !== taskId) {
      return {
        code: 'invalid_parent',
        message: `Comment parent '${input.parent_id}' does not belong to task '${taskId}'.`,
      }
    }
  }

  return undefined
}

export function runWorkflowTransaction(
  db: TrackerDatabase,
  taskId: string,
  newState: string,
  comments: WorkflowCommentInput[] = [],
): { ok: true; data: WorkflowResult } | { ok: false; error: WorkflowError } {
  const tx = db.transaction((targetState: string, commentInputs: WorkflowCommentInput[]) => {
    // Validate all comments before any mutation
    for (const input of commentInputs) {
      const error = validateComment(db, taskId, input)
      if (error) {
        throw new WorkflowTransactionError(error)
      }
    }

    // Update task state
    const updatedAt = Date.now()
    db.prepare(
      `UPDATE tasks
       SET state = ?, updated_at = ?
       WHERE id = ?`,
    ).run(targetState, updatedAt, taskId)

    // Insert comments
    const insertedComments: ReviewComment[] = []
    const now = Date.now()

    for (const input of commentInputs) {
      const id = randomUUID()
      db.prepare(
        `INSERT INTO review_comments
          (id, task_id, parent_id, severity, body, author, line, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        taskId,
        input.parent_id ?? null,
        input.severity,
        input.body,
        input.author ?? null,
        input.line ?? null,
        now,
        now,
      )

      const row = db
        .prepare('SELECT * FROM review_comments WHERE id = ? AND task_id = ?')
        .get(id, taskId) as ReviewComment | undefined

      if (!row) {
        throw new WorkflowTransactionError({
          code: 'invalid_comments',
          message: 'Failed to insert comment during workflow transaction.',
        })
      }

      insertedComments.push(row)
    }

    // Fetch updated task
    const taskRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task | undefined
    if (!taskRow) {
      throw new WorkflowTransactionError({
        code: 'task_not_found',
        message: `Task '${taskId}' was not found.`,
      })
    }

    return { task: taskRow, comments: insertedComments }
  })

  try {
    const result = tx(newState, comments)
    return { ok: true, data: result }
  } catch (error) {
    if (error instanceof WorkflowTransactionError) {
      return { ok: false, error: error.workflowError }
    }
    throw error
  }
}

class WorkflowTransactionError extends Error {
  workflowError: WorkflowError

  constructor(error: WorkflowError) {
    super(error.message)
    this.name = 'WorkflowTransactionError'
    this.workflowError = error
  }
}
