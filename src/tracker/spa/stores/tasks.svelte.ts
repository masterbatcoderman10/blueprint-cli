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

  // State variables — in Svelte component context (.svelte files importing this
  // module) these would use $state runes for reactivity. For now they are plain
  // mutable variables; reactivity is wired up by the consuming Svelte component.
  let tasks: TaskData[] = []
  let loading: boolean = false
  let error: string | null = null

  let timerId: ReturnType<typeof setInterval> | null = null
  let paused = false

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
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          handleVisibilityChange(document.visibilityState)
        })
      }
    },

    stop() {
      stopInterval()
    },

    setFilter(newFilter: TaskFilter) {
      filter = newFilter
      void fetchOnce()
    },

    handleVisibilityChange,
  }
}
