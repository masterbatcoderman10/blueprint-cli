// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import CommentThread from '../../../src/tracker/spa/components/CommentThread.svelte'
import { createMockCommentsStore } from './helpers.svelte'

afterEach(() => {
  cleanup()
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
})
