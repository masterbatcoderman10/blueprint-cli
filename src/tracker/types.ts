export type TrackerResult<TData, TError> = { data: TData } | { error: TError }

export type Result<TData, TError> = { ok: true; data: TData } | { ok: false; error: TError }

export type JsonObject = Record<string, unknown>

export const TASK_STATES = ['TO-DO', 'IN-PROGRESS', 'IN-REVIEW', 'REWORK', 'DONE'] as const

export type TaskState = (typeof TASK_STATES)[number]

export interface Task {
  id: string
  title: string
  description: string
  state: TaskState
  phase: string
  stream: string | null
  author: string | null
  implementation_notes: string | null
  milestone: string
  created_at: number
  updated_at: number
}

export interface CreateTaskInput {
  id: string
  title: string
  description: string
  state: TaskState | string
  phase: string
  stream?: string | null
  author?: string | null
  implementation_notes?: string | null
  milestone?: string
  now?: number
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  state?: TaskState | string
  phase?: string
  stream?: string | null
  author?: string | null
  implementation_notes?: string | null
  milestone?: string
  now?: number
}

export interface TaskFilter {
  phase?: string
  stream?: string
  milestone?: string
}

export type TaskError =
  | { code: 'invalid_state'; message: string }
  | { code: 'duplicate_id'; message: string }
  | { code: 'task_not_found'; message: string }
  | { code: 'invalid_milestone'; message: string }

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

// ─── Gated Workflow Endpoints ───

export type WorkflowVerb = 'start' | 'submit' | 'resume' | 'approve' | 'reject'

export interface WorkflowCommentInput {
  severity: CommentSeverity | string
  body: string
  author?: string | null
  line?: string | null
  parent_id?: string | null
}

export interface WorkflowRequest {
  comments?: WorkflowCommentInput[]
}

export interface WorkflowResult {
  task: Task
  comments: ReviewComment[]
}

export type WorkflowValidationResult =
  | { ok: true; kind: 'transition'; verb: WorkflowVerb; from: TaskState; to: TaskState }
  | { ok: true; kind: 'noop'; verb: WorkflowVerb; state: TaskState }
  | { ok: false; code: 'illegal_transition'; message: string }
  | { ok: false; code: 'unknown_verb'; message: string }
  | { ok: false; code: 'unknown_state'; message: string }

export type WorkflowError =
  | { code: 'illegal_transition'; message: string }
  | { code: 'unknown_verb'; message: string }
  | { code: 'unknown_state'; message: string }
  | { code: 'task_not_found'; message: string }
  | { code: 'invalid_comments'; message: string }
  | { code: 'invalid_severity'; message: string }
  | { code: 'invalid_parent'; message: string }
