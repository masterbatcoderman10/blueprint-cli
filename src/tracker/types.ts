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
  now?: number
}

export interface TaskFilter {
  phase?: string
  stream?: string
}

export type TaskError =
  | { code: 'invalid_state'; message: string }
  | { code: 'duplicate_id'; message: string }
  | { code: 'task_not_found'; message: string }

export type Result<TData, TError> = { ok: true; data: TData } | { ok: false; error: TError }
