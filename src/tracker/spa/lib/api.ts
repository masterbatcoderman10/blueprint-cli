/**
 * src/tracker/spa/lib/api.ts
 * Typed fetch wrappers for the Blueprint Tracker REST API.
 * All functions return Result<T, ApiError> — never throw.
 * Base URL: window.location.origin (same-origin, no CORS needed).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
}

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

// Task shapes (mirrors P1 server types)
export interface TaskData {
  id?: string
  title?: string
  status?: string
  phase?: string
  stream?: string
  gate?: string
  description?: string
  [key: string]: unknown
}

export interface CommentData {
  id?: string
  taskId?: string
  body?: string
  severity?: string
  line?: number | null
  author?: string
  [key: string]: unknown
}

export interface ProjectData {
  name?: string
  description?: string
  [key: string]: unknown
}

export interface TaskFilter {
  status?: string
  phase?: string
  stream?: string
  gate?: string
  [key: string]: string | undefined
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseUrl(): string {
  // In browser: window.location.origin. In tests: globalThis.location.origin or
  // globalThis.window?.location?.origin.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  if (typeof location !== 'undefined' && location.origin) {
    return location.origin
  }
  return 'http://localhost:3000'
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ''
  ) as [string, string][]
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<Result<T>> {
  try {
    const url = `${baseUrl()}${path}`
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      // Non-JSON response (e.g. 204 No Content)
      if (res.ok) {
        return { ok: true, data: undefined as unknown as T }
      }
      return {
        ok: false,
        error: { code: String(res.status), message: res.statusText },
      }
    }

    // Server uses { ok: true, data: ... } | { ok: false, error: { code, message } } envelope
    if (
      payload !== null &&
      typeof payload === 'object' &&
      'ok' in (payload as object)
    ) {
      const envelope = payload as { ok: boolean; data?: T; error?: ApiError }
      if (envelope.ok) {
        return { ok: true, data: envelope.data as T }
      }
      return {
        ok: false,
        error: envelope.error ?? {
          code: String(res.status),
          message: 'Unknown error',
        },
      }
    }

    // Bare response (non-envelope)
    if (res.ok) {
      return { ok: true, data: payload as T }
    }
    return {
      ok: false,
      error: { code: String(res.status), message: res.statusText },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: { code: 'NETWORK_ERROR', message } }
  }
}

// ─── Task wrappers ────────────────────────────────────────────────────────────

export function listTasks(filter?: TaskFilter): Promise<Result<TaskData[]>> {
  const qs = filter ? buildQueryString(filter as Record<string, string | undefined>) : ''
  return request<TaskData[]>(`/tasks${qs}`)
}

export function getTask(id: string): Promise<Result<TaskData>> {
  return request<TaskData>(`/tasks/${encodeURIComponent(id)}`)
}

export function createTask(data: TaskData): Promise<Result<TaskData>> {
  return request<TaskData>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTask(id: string, data: Partial<TaskData>): Promise<Result<TaskData>> {
  return request<TaskData>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteTask(id: string): Promise<Result<void>> {
  return request<void>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ─── Comment wrappers ─────────────────────────────────────────────────────────

export function listComments(taskId: string): Promise<Result<CommentData[]>> {
  return request<CommentData[]>(`/tasks/${encodeURIComponent(taskId)}/comments`)
}

export function createComment(
  taskId: string,
  data: CommentData
): Promise<Result<CommentData>> {
  return request<CommentData>(
    `/tasks/${encodeURIComponent(taskId)}/comments`,
    { method: 'POST', body: JSON.stringify(data) }
  )
}

export function updateComment(
  id: string,
  data: Partial<CommentData>
): Promise<Result<CommentData>> {
  return request<CommentData>(`/comments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteComment(id: string): Promise<Result<void>> {
  return request<void>(`/comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ─── Project wrapper ──────────────────────────────────────────────────────────

export function getProject(): Promise<Result<ProjectData>> {
  return request<ProjectData>('/project')
}
