/**
 * src/tracker/spa/stores/tasks.svelte.ts
 * Svelte 5 rune-based task list store with polling driver.
 *
 * Default poll interval: 2 000 ms.
 * Polling pauses when document.visibilityState === 'hidden' and resumes on
 * 'visibilitychange' back to 'visible'.
 *
 * Design contract: mirrors 2YY-0 artboard column model.
 */

import { listTasks, type TaskData, type TaskFilter } from '../lib/api.js'

export interface TasksStoreOptions {
  intervalMs?: number
  filter?: TaskFilter
}

export interface TasksStore {
  /** Current task list — reactive ($state under the hood in Svelte context) */
  readonly tasks: TaskData[]
  /** True while a fetch is in flight */
  readonly loading: boolean
  /** Last fetch error, or null */
  readonly error: string | null
  /** Start polling */
  start(): void
  /** Stop polling and release interval */
  stop(): void
  /** Update the active filter and immediately re-fetch */
  setFilter(filter: TaskFilter): void
  /**
   * Exposed for testing — call with 'hidden' or 'visible' to simulate
   * document.visibilityState changes without requiring a real DOM event.
   */
  handleVisibilityChange(state: DocumentVisibilityState): void
}

export function createTasksStore(options: TasksStoreOptions = {}): TasksStore {
  const intervalMs = options.intervalMs ?? 2000
  let filter: TaskFilter = options.filter ?? {}

  // State variables — Svelte 5 runes for reactivity in .svelte.ts files
  let tasks = $state<TaskData[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)

  let timerId: ReturnType<typeof setInterval> | null = null
  let paused = false
  let visibilityListener: (() => void) | null = null

  async function fetchOnce(): Promise<void> {
    loading = true
    const result = await listTasks(filter)
    loading = false
    if (result.ok) {
      tasks = result.data
      error = null
    } else {
      error = result.error.message
    }
  }

  function startInterval(): void {
    if (timerId !== null) return
    timerId = setInterval(() => {
      if (!paused) {
        void fetchOnce()
      }
    }, intervalMs)
  }

  function stopInterval(): void {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function handleVisibilityChange(state: DocumentVisibilityState): void {
    if (state === 'hidden') {
      paused = true
    } else {
      paused = false
      // Immediately re-fetch on becoming visible
      void fetchOnce()
    }
  }

  return {
    get tasks() { return tasks },
    get loading() { return loading },
    get error() { return error },

    start() {
      void fetchOnce()
      startInterval()

      // Wire up real visibilitychange events when document is available
      if (typeof document !== 'undefined' && visibilityListener === null) {
        visibilityListener = () => {
          handleVisibilityChange(document.visibilityState)
        }
        document.addEventListener('visibilitychange', visibilityListener)
      }
    },

    stop() {
      stopInterval()
      if (typeof document !== 'undefined' && visibilityListener !== null) {
        document.removeEventListener('visibilitychange', visibilityListener)
        visibilityListener = null
      }
    },

    setFilter(newFilter: TaskFilter) {
      filter = newFilter
      void fetchOnce()
    },

    handleVisibilityChange,
  }
}
