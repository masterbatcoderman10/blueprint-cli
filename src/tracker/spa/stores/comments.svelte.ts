/**
 * src/tracker/spa/stores/comments.svelte.ts
 * Svelte 5 rune-based per-task comment cache.
 *
 * Cache is keyed by taskId. Invalidated (cleared) when a new taskId is loaded
 * that differs from the previously cached one. Repeated calls for the same
 * taskId use the cached result without re-fetching.
 */

import { listComments, type CommentData } from '../lib/api.js'

export interface CommentsStore {
  /** Comments for the currently loaded task */
  readonly comments: CommentData[]
  /** True while a fetch is in flight */
  readonly loading: boolean
  /** Last fetch error, or null */
  readonly error: string | null
  /** Load comments for a task. Uses cache if taskId matches last loaded. */
  loadForTask(taskId: string): Promise<void>
  /** Explicitly invalidate cache for a given taskId */
  invalidate(taskId?: string): void
}

export function createCommentsStore(): CommentsStore {
  let comments: CommentData[] = []
  let loading: boolean = false
  let error: string | null = null

  // Cache: last fetched task ID and its comments
  let cachedTaskId: string | null = null
  let cachedComments: CommentData[] = []

  return {
    get comments() { return comments },
    get loading() { return loading },
    get error() { return error },

    async loadForTask(taskId: string): Promise<void> {
      // Use cache if same task
      if (cachedTaskId === taskId) {
        comments = cachedComments
        return
      }

      // New task — invalidate and fetch
      cachedTaskId = null
      cachedComments = []
      comments = []

      loading = true
      const result = await listComments(taskId)
      loading = false

      if (result.ok) {
        cachedTaskId = taskId
        cachedComments = result.data
        comments = result.data
        error = null
      } else {
        error = result.error.message
      }
    },

    invalidate(taskId?: string): void {
      if (taskId === undefined || taskId === cachedTaskId) {
        cachedTaskId = null
        cachedComments = []
        comments = []
      }
    },
  }
}
