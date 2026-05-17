export type TrackerResult<TData, TError> = { data: TData } | { error: TError }

export type CommentSeverity = 'MAJOR' | 'MINOR'

export interface ReviewComment {
  id: string
  task_id: string
  parent_id: string | null
  severity: CommentSeverity
  body: string
  author: string | null
  line: string | null
  created_at: number
  updated_at: number
}

export interface CreateCommentInput {
  severity: CommentSeverity | string
  body: string
  author?: string | null
  line?: string | null
  parent_id?: string | null
}

export interface UpdateCommentInput {
  severity?: CommentSeverity | string
  body?: string
  author?: string | null
  line?: string | null
  parent_id?: string | null
}

export type CommentErrorCode = 'task_not_found' | 'comment_not_found' | 'invalid_severity' | 'invalid_parent'

export interface CommentError {
  code: CommentErrorCode
  message: string
}

export interface DeleteCommentResult {
  deleted: true
}
