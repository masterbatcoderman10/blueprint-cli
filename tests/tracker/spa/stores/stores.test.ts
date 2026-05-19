/**
 * Gate R6-2.0 — Svelte 5 rune stores
 * Tests: T-2.0.6.1, T-2.0.6.2, T-2.0.6.3, T-2.0.6.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock window.location
Object.defineProperty(globalThis, 'location', {
  value: { origin: 'http://localhost:3000', hash: '' },
  configurable: true,
  writable: true,
})

// Mock document.visibilityState
Object.defineProperty(globalThis, 'document', {
  value: {
    visibilityState: 'visible',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  configurable: true,
  writable: true,
})

// Mock window.addEventListener for hashchange
const windowListeners: Record<string, EventListenerOrEventListenerObject[]> = {}
Object.defineProperty(globalThis, 'window', {
  value: {
    addEventListener: vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
      windowListeners[event] = windowListeners[event] ?? []
      windowListeners[event].push(handler)
    }),
    removeEventListener: vi.fn(),
    location: { origin: 'http://localhost:3000', hash: '' },
  },
  configurable: true,
  writable: true,
})

// T-2.0.6.1 — Tasks store polling: listTasks called once per tick
describe('T-2.0.6.1: tasks store polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    mockFetch.mockReset()
  })

  it('polls listTasks once per interval tick', async () => {
    vi.resetModules()
    const { createTasksStore } = await import('../../../../src/tracker/spa/stores/tasks.svelte')

    const store = createTasksStore({ intervalMs: 2000 })
    store.start()

    // Initial fetch on start — flush microtasks
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Advance one interval
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Advance another interval
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetch).toHaveBeenCalledTimes(3)

    store.stop()
  })
})

// T-2.0.6.2 — Polling pauses on visibilitychange→hidden; resumes on visible
describe('T-2.0.6.2: polling pauses/resumes on visibility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    mockFetch.mockReset()
  })

  it('stops polling when document becomes hidden', async () => {
    vi.resetModules()
    const { createTasksStore } = await import('../../../../src/tracker/spa/stores/tasks.svelte')

    const store = createTasksStore({ intervalMs: 1000 })
    store.start()

    await Promise.resolve()
    await Promise.resolve()
    const countAfterStart = mockFetch.mock.calls.length

    // Simulate visibility hidden
    store.handleVisibilityChange('hidden')

    await vi.advanceTimersByTimeAsync(3000)
    await Promise.resolve()
    await Promise.resolve()

    // Fetch count should not increase beyond initial
    expect(mockFetch.mock.calls.length).toBe(countAfterStart)

    store.stop()
  })

  it('resumes polling when document becomes visible', async () => {
    vi.resetModules()
    const { createTasksStore } = await import('../../../../src/tracker/spa/stores/tasks.svelte')

    const store = createTasksStore({ intervalMs: 1000 })
    store.start()
    await Promise.resolve()
    await Promise.resolve()

    // Go hidden
    store.handleVisibilityChange('hidden')
    await vi.advanceTimersByTimeAsync(3000)
    await Promise.resolve()
    await Promise.resolve()
    const countWhileHidden = mockFetch.mock.calls.length

    // Come back visible — immediate fetch on resume
    store.handleVisibilityChange('visible')
    await Promise.resolve()
    await Promise.resolve()
    expect(mockFetch.mock.calls.length).toBeGreaterThan(countWhileHidden)

    store.stop()
  })
})

// T-2.0.6.3 — Selection store writes window.location.hash on change; reads on hashchange
describe('T-2.0.6.3: selection store ↔ URL hash', () => {
  beforeEach(() => {
    vi.resetModules()
    ;(globalThis as any).window.location.hash = ''
  })

  it('writes location.hash when selection changes', async () => {
    const { createSelectionStore } = await import('../../../../src/tracker/spa/stores/selection.svelte')
    const store = createSelectionStore()

    store.select('task-123')
    expect((globalThis as any).window.location.hash).toBe('#task=task-123')
  })

  it('clears location.hash when selection is cleared', async () => {
    vi.resetModules()
    const { createSelectionStore } = await import('../../../../src/tracker/spa/stores/selection.svelte')
    const store = createSelectionStore()

    store.select('task-abc')
    store.clear()
    expect((globalThis as any).window.location.hash).toBe('')
  })

  it('reads hash and sets selectedId on init', async () => {
    ;(globalThis as any).window.location.hash = '#task=task-456'
    vi.resetModules()
    const { createSelectionStore } = await import('../../../../src/tracker/spa/stores/selection.svelte')
    const store = createSelectionStore()
    expect(store.selectedId).toBe('task-456')
  })
})

// T-2.0.6.4 — Comments store invalidates cache on selection change
describe('T-2.0.6.4: comments store cache invalidation', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  it('invalidates cache when selectedTaskId changes', async () => {
    vi.resetModules()
    const { createCommentsStore } = await import('../../../../src/tracker/spa/stores/comments.svelte')
    const store = createCommentsStore()

    // Load comments for task-1
    await store.loadForTask('task-1')
    const countAfterTask1 = mockFetch.mock.calls.length

    // Switch to task-2 — cache for task-1 should be bypassed, new fetch issued
    await store.loadForTask('task-2')
    expect(mockFetch.mock.calls.length).toBeGreaterThan(countAfterTask1)
  })

  it('uses cached comments when same task requested again', async () => {
    vi.resetModules()
    const { createCommentsStore } = await import('../../../../src/tracker/spa/stores/comments.svelte')
    const store = createCommentsStore()

    await store.loadForTask('task-1')
    const countAfterFirst = mockFetch.mock.calls.length

    // Same task again — should use cache, no new fetch
    await store.loadForTask('task-1')
    expect(mockFetch.mock.calls.length).toBe(countAfterFirst)
  })
})

// T-R6-5.B.2 — Store filter state holds milestone alongside phase and stream
describe('T-R6-5.B.2: store filter passes milestone to fetchTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    mockFetch.mockReset()
  })

  it('passes milestone filter through to fetchTasks', async () => {
    vi.resetModules()
    const { createTasksStore } = await import('../../../../src/tracker/spa/stores/tasks.svelte')

    const store = createTasksStore({ intervalMs: 60000 })
    store.start()
    await Promise.resolve()
    await Promise.resolve()

    // Now set filter with milestone
    store.setFilter({ milestone: 'R6', phase: 'R6-3', stream: 'A' })
    await Promise.resolve()
    await Promise.resolve()

    // Find the last fetch call (the one from setFilter)
    const lastCallUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string
    expect(lastCallUrl).toContain('milestone=R6')
    expect(lastCallUrl).toContain('phase=R6-3')
    expect(lastCallUrl).toContain('stream=A')

    store.stop()
  })
})
