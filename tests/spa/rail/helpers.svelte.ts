import type { TaskData, CommentData } from '../../src/tracker/spa/lib/api.js'

export interface MockTasksStore {
  readonly tasks: TaskData[]
  readonly loading: boolean
  readonly error: string | null
  start(): void
  stop(): void
  setFilter(): void
  handleVisibilityChange(): void
  _setTasks(t: TaskData[]): void
}

export function createMockTasksStore(initial: TaskData[] = []): MockTasksStore {
  let tasks = $state<TaskData[]>(initial)
  return {
    get tasks() { return tasks },
    get loading() { return false },
    get error() { return null },
    start() {},
    stop() {},
    setFilter() {},
    handleVisibilityChange() {},
    _setTasks(t: TaskData[]) { tasks = t },
  }
}

export interface MockSelectionStore {
  readonly selectedId: string | null
  select(id: string): void
  clear(): void
}

export function createMockSelectionStore(initial: string | null = null): MockSelectionStore {
  let selectedId = $state<string | null>(initial)
  return {
    get selectedId() { return selectedId },
    select(id: string) { selectedId = id },
    clear() { selectedId = null },
  }
}

export interface MockCommentsStore {
  readonly comments: CommentData[]
  readonly loading: boolean
  readonly error: string | null
  loadForTask(taskId: string): Promise<void>
  invalidate(taskId?: string): void
  _setComments(c: CommentData[]): void
}

export function createMockCommentsStore(initial: CommentData[] = []): MockCommentsStore {
  let comments = $state<CommentData[]>(initial)
  return {
    get comments() { return comments },
    get loading() { return false },
    get error() { return null },
    async loadForTask() {},
    invalidate() {},
    _setComments(c: CommentData[]) { comments = c },
  }
}
