// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import CommentThread from '../../../src/tracker/spa/components/CommentThread.svelte'
import { createMockCommentsStore } from './helpers.svelte'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('R6-2.B.4: CommentThread', () => {
  it('groups comments by severity: MAJORs first then MINORs', () => {
    const comments = createMockCommentsStore([
      {
        id: 'c1',
        task_id: 't1',
        parent_id: null,
        severity: 'MINOR',
        body: 'Minor first chronologically',
        author: 'A',
        line: null,
        created_at: 1000,
      },
      {
        id: 'c2',
        task_id: 't1',
        parent_id: null,
        severity: 'MAJOR',
        body: 'Major',
        author: 'B',
        line: null,
        created_at: 2000,
      },
      {
        id: 'c3',
        task_id: 't1',
        parent_id: null,
        severity: 'MINOR',
        body: 'Minor second',
        author: 'C',
        line: null,
        created_at: 3000,
      },
    ])

    render(CommentThread, { props: { taskId: 't1', comments } })
    const items = screen.getAllByTestId('comment-item')
    expect(items.length).toBe(3)
    expect(items[0].getAttribute('data-severity')).toBe('MAJOR')
    expect(items[1].getAttribute('data-severity')).toBe('MINOR')
    expect(items[2].getAttribute('data-severity')).toBe('MINOR')
  })

  it('orders within each group chronologically ascending', () => {
    const comments = createMockCommentsStore([
      {
        id: 'c1',
        task_id: 't1',
        parent_id: null,
        severity: 'MAJOR',
        body: 'Later major',
        author: 'A',
        line: null,
        created_at: 3000,
      },
      {
        id: 'c2',
        task_id: 't1',
        parent_id: null,
        severity: 'MAJOR',
        body: 'Earlier major',
        author: 'B',
        line: null,
        created_at: 1000,
      },
    ])

    render(CommentThread, { props: { taskId: 't1', comments } })
    const items = screen.getAllByTestId('comment-item')
    expect(items[0].textContent).toContain('Earlier major')
    expect(items[1].textContent).toContain('Later major')
  })

  it('threads replies under parent (single level)', () => {
    const comments = createMockCommentsStore([
      {
        id: 'c1',
        task_id: 't1',
        parent_id: null,
        severity: 'MAJOR',
        body: 'Parent',
        author: 'A',
        line: null,
        created_at: 1000,
      },
      {
        id: 'c2',
        task_id: 't1',
        parent_id: 'c1',
        severity: 'MINOR',
        body: 'Reply',
        author: 'B',
        line: null,
        created_at: 2000,
      },
    ])

    render(CommentThread, { props: { taskId: 't1', comments } })
    expect(screen.getAllByTestId('comment-item').length).toBe(1)
    expect(screen.getAllByTestId('reply-item').length).toBe(1)
  })

  it('shows top-of-thread composer when + MAJOR clicked', async () => {
    const comments = createMockCommentsStore([])
    render(CommentThread, { props: { taskId: 't1', comments } })

    await fireEvent.click(screen.getByTestId('add-major'))
    expect(screen.getByTestId('top-composer')).toBeTruthy()
    expect(screen.getByText('MAJOR')).toBeTruthy()
  })

  it('shows top-of-thread composer when + MINOR clicked', async () => {
    const comments = createMockCommentsStore([])
    render(CommentThread, { props: { taskId: 't1', comments } })

    await fireEvent.click(screen.getByTestId('add-minor'))
    expect(screen.getByTestId('top-composer')).toBeTruthy()
    expect(screen.getByText('MINOR')).toBeTruthy()
  })

  it('shows empty state when no comments', () => {
    const comments = createMockCommentsStore([])
    render(CommentThread, { props: { taskId: 't1', comments } })
    expect(screen.getByTestId('empty-comments').textContent).toBe('No comments yet.')
  })

  it('invalidates comment cache before reloading after submit (BUG-001)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, data: { id: 'new-comment' } }),
    })

    const comments = createMockCommentsStore([])
    const invalidateSpy = vi.spyOn(comments, 'invalidate')
    const loadSpy = vi.spyOn(comments, 'loadForTask')

    render(CommentThread, { props: { taskId: 't1', comments } })

    await fireEvent.click(screen.getByTestId('add-major'))
    await fireEvent.input(screen.getByTestId('composer-body'), {
      target: { value: 'New comment' },
    })
    await fireEvent.click(screen.getByTestId('composer-submit'))

    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith('t1')
      expect(loadSpy).toHaveBeenCalledWith('t1')
    })

    // Verify invalidate is called before loadForTask
    const invalidateCallOrder = invalidateSpy.mock.invocationCallOrder[0]
    const loadCallOrder = loadSpy.mock.invocationCallOrder[0]
    expect(invalidateCallOrder).toBeLessThan(loadCallOrder)
  })
})
