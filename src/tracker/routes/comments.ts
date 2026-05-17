import { randomUUID } from 'node:crypto'

import type { TrackerDatabase } from '../schema'
import type {
  CommentError,
  CommentSeverity,
  CreateCommentInput,
  DeleteCommentResult,
  ReviewComment,
  TrackerResult,
  UpdateCommentInput,
} from '../types'

type CommentResult<TData> = TrackerResult<TData, CommentError>

const VALID_SEVERITIES = new Set<string>(['MAJOR', 'MINOR'])

function error(code: CommentError['code'], message: string): { error: CommentError } {
  return { error: { code, message } }
}

function isCommentSeverity(value: string | undefined): value is CommentSeverity {
  return value !== undefined && VALID_SEVERITIES.has(value)
}

function taskExists(db: TrackerDatabase, taskId: string): boolean {
  return Boolean(db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(taskId))
}

function getComment(db: TrackerDatabase, taskId: string, commentId: string): ReviewComment | undefined {
  return db
    .prepare('SELECT * FROM review_comments WHERE id = ? AND task_id = ?')
    .get(commentId, taskId) as ReviewComment | undefined
}

function mapComment(row: unknown): ReviewComment {
  const comment = row as ReviewComment
  return {
    id: comment.id,
    task_id: comment.task_id,
    parent_id: comment.parent_id,
    severity: comment.severity,
    body: comment.body,
    author: comment.author,
    line: comment.line,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  }
}

function validateParent(db: TrackerDatabase, taskId: string, parentId: string | null | undefined): CommentError | undefined {
  if (!parentId) {
    return undefined
  }

  const parent = db.prepare('SELECT task_id FROM review_comments WHERE id = ?').get(parentId) as
    | { task_id: string }
    | undefined

  if (!parent || parent.task_id !== taskId) {
    return {
      code: 'invalid_parent',
      message: `Comment parent '${parentId}' does not belong to task '${taskId}'.`,
    }
  }

  return undefined
}

export function createComment(
  db: TrackerDatabase,
  taskId: string,
  input: CreateCommentInput,
): CommentResult<ReviewComment> {
  if (!isCommentSeverity(input.severity)) {
    return error('invalid_severity', 'Comment severity must be MAJOR or MINOR.')
  }

  if (!taskExists(db, taskId)) {
    return error('task_not_found', `Task '${taskId}' was not found.`)
  }

  const parentError = validateParent(db, taskId, input.parent_id)
  if (parentError) {
    return { error: parentError }
  }

  const now = Date.now()
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

  return { data: getComment(db, taskId, id) as ReviewComment }
}

export function listComments(db: TrackerDatabase, taskId: string): CommentResult<ReviewComment[]> {
  const rows = db
    .prepare('SELECT * FROM review_comments WHERE task_id = ? ORDER BY created_at ASC')
    .all(taskId)
    .map(mapComment)

  return { data: rows }
}

export function updateComment(
  db: TrackerDatabase,
  taskId: string,
  commentId: string,
  input: UpdateCommentInput,
): CommentResult<ReviewComment> {
  if (input.severity !== undefined && !isCommentSeverity(input.severity)) {
    return error('invalid_severity', 'Comment severity must be MAJOR or MINOR.')
  }

  if (!taskExists(db, taskId)) {
    return error('task_not_found', `Task '${taskId}' was not found.`)
  }

  const existing = getComment(db, taskId, commentId)
  if (!existing) {
    return error('comment_not_found', `Comment '${commentId}' was not found.`)
  }

  const parentError = validateParent(db, taskId, input.parent_id)
  if (parentError) {
    return { error: parentError }
  }

  const updated = {
    severity: input.severity ?? existing.severity,
    body: input.body ?? existing.body,
    author: input.author === undefined ? existing.author : input.author,
    line: input.line === undefined ? existing.line : input.line,
    parent_id: input.parent_id === undefined ? existing.parent_id : input.parent_id,
    updated_at: Date.now(),
  }

  db.prepare(
    `UPDATE review_comments
     SET severity = ?, body = ?, author = ?, line = ?, parent_id = ?, updated_at = ?
     WHERE id = ? AND task_id = ?`,
  ).run(
    updated.severity,
    updated.body,
    updated.author,
    updated.line,
    updated.parent_id,
    updated.updated_at,
    commentId,
    taskId,
  )

  return { data: getComment(db, taskId, commentId) as ReviewComment }
}

export function deleteComment(
  db: TrackerDatabase,
  taskId: string,
  commentId: string,
): CommentResult<DeleteCommentResult> {
  if (!taskExists(db, taskId)) {
    return error('task_not_found', `Task '${taskId}' was not found.`)
  }

  const result = db.prepare('DELETE FROM review_comments WHERE id = ? AND task_id = ?').run(commentId, taskId)
  if (result.changes === 0) {
    return error('comment_not_found', `Comment '${commentId}' was not found.`)
  }

  return { data: { deleted: true } }
}
