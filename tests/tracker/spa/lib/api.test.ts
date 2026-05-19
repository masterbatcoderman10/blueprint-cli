/**
 * Gate R6-2.0 — api.ts fetch wrappers
 * Tests: T-2.0.5.1, T-2.0.5.2, T-2.0.5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We import the api module — this needs a browser-like environment.
// vitest is configured with jsdom environment for this file via inline config.

// Mock fetch globally before importing api
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock window.location for base URL
Object.defineProperty(globalThis, 'location', {
  value: { origin: 'http://localhost:3000' },
  configurable: true,
})

// Dynamic import after stubs are in place
let api: typeof import('../../../../src/tracker/spa/lib/api')

beforeEach(async () => {
  vi.resetModules()
  mockFetch.mockReset()
  api = await import('../../../../src/tracker/spa/lib/api')
})

afterEach(() => {
  vi.restoreAllMocks()
})

// T-2.0.5.3 — All 10 wrappers exported
describe('T-2.0.5.3: all 10 wrappers exported', () => {
  it('exports listTasks', async () => {
    expect(typeof api.listTasks).toBe('function')
  })
  it('exports getTask', async () => {
    expect(typeof api.getTask).toBe('function')
  })
  it('exports createTask', async () => {
    expect(typeof api.createTask).toBe('function')
  })
  it('exports updateTask', async () => {
    expect(typeof api.updateTask).toBe('function')
  })
  it('exports deleteTask', async () => {
    expect(typeof api.deleteTask).toBe('function')
  })
  it('exports listComments', async () => {
    expect(typeof api.listComments).toBe('function')
  })
  it('exports createComment', async () => {
    expect(typeof api.createComment).toBe('function')
  })
  it('exports updateComment', async () => {
    expect(typeof api.updateComment).toBe('function')
  })
  it('exports deleteComment', async () => {
    expect(typeof api.deleteComment).toBe('function')
  })
  it('exports getProject', async () => {
    expect(typeof api.getProject).toBe('function')
  })
})

// T-2.0.5.1 — listTasks success: mocked fetch returns array → { ok: true, data: [...] }
describe('T-2.0.5.1: listTasks success path', () => {
  it('returns ok:true with data on 200 response', async () => {
    const tasks = [{ id: '1', title: 'Test task' }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: tasks }),
    })

    const result = await api.listTasks()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(tasks)
    }
  })

  it('passes filter as query string when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })

    await api.listTasks({ status: 'In Progress' })
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('status=')
  })

  // T-R6-5.B.1 — milestone filter in query string
  it('appends milestone to URL when filter supplied', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    })

    await api.listTasks({ milestone: 'R6', phase: 'R6-3', stream: 'A' })
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('milestone=R6')
    expect(calledUrl).toContain('phase=R6-3')
    expect(calledUrl).toContain('stream=A')
  })
})

// T-2.0.5.2 — createTask error: mocked 400 + envelope → { ok: false, error: { code, message } }
describe('T-2.0.5.2: createTask error path', () => {
  it('returns ok:false with ApiError on 400 response', async () => {
    const errPayload = { ok: false, error: { code: 'VALIDATION_ERROR', message: 'title required' } }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errPayload,
    })

    const result = await api.createTask({ title: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toHaveProperty('code')
      expect(result.error).toHaveProperty('message')
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('returns ok:false with network error on fetch rejection', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await api.createTask({ title: 'test' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toHaveProperty('code')
      expect(result.error).toHaveProperty('message')
    }
  })
})
