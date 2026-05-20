// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import { tick } from 'svelte'
import TaskDetailRail from '../../../src/tracker/spa/components/TaskDetailRail.svelte'
import BackgroundClickWrapper from './background-click-wrapper.svelte'
import {
  createMockTasksStore,
  createMockSelectionStore,
  createMockCommentsStore,
} from './helpers.svelte'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('R6-2.B.5 / R6-2.B.6: Integration', () => {
  it('rail opens and closes with selection', async () => {
    const selection = createMockSelectionStore(null)
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.queryByTestId('task-detail-rail')).toBeNull()

    selection.select('task-1')
    await tick()
    expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

    selection.clear()
    await tick()
    expect(screen.queryByTestId('task-detail-rail')).toBeNull()
  })

  it('status dot color matches state', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'IN-REVIEW', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const dot = screen.getByTestId('status-dot')
    expect(dot.getAttribute('style')).toContain('background-color: rgb(167, 139, 250)')
  })

  it('description edit saves via mocked PATCH', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { id: 'task-1', description: 'Updated' } }),
    })

    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Original' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    await fireEvent.click(screen.getByTestId('desc-text'))

    const textarea = screen.getByTestId('desc-textarea')
    await fireEvent.input(textarea, { target: { value: 'Updated' } })
    await fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/task-1'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
  })

  it('description clean-blur is no-op', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Same' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    await fireEvent.click(screen.getByTestId('desc-text'))
    await fireEvent.blur(screen.getByTestId('desc-textarea'))

    expect(screen.getByTestId('desc-text').textContent).toContain('Same')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('composer MAJOR submit with reply parent_id end-to-end', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ ok: true, data: { id: 'reply-1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          data: [
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
              id: 'reply-1',
              task_id: 't1',
              parent_id: 'c1',
              severity: 'MAJOR',
              body: 'Reply text',
              author: 'B',
              line: null,
              created_at: 2000,
            },
          ],
        }),
      })

    const selection = createMockSelectionStore('t1')
    const tasks = createMockTasksStore([
      { id: 't1', title: 'Task', state: 'TO-DO', description: 'Desc' },
    ])
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
    ])

    render(TaskDetailRail, { props: { selection, tasks, comments } })

    // Click Reply on the comment
    await fireEvent.click(screen.getByTestId('reply-link'))

    // Fill and submit reply composer
    await fireEvent.input(screen.getByTestId('composer-body'), {
      target: { value: 'Reply text' },
    })
    await fireEvent.click(screen.getByTestId('composer-submit'))

    await vi.waitFor(() => {
      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(calledBody.severity).toBe('MAJOR')
      expect(calledBody.parent_id).toBe('c1')
    })
  })

  it('thread ordering: majors first', () => {
    const selection = createMockSelectionStore('t1')
    const tasks = createMockTasksStore([
      { id: 't1', title: 'Task', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([
      {
        id: 'c1',
        task_id: 't1',
        parent_id: null,
        severity: 'MINOR',
        body: 'Minor',
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
    ])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const items = screen.getAllByTestId('comment-item')
    expect(items[0].getAttribute('data-severity')).toBe('MAJOR')
    expect(items[1].getAttribute('data-severity')).toBe('MINOR')
  })

  it('reply renders under parent', () => {
    const selection = createMockSelectionStore('t1')
    const tasks = createMockTasksStore([
      { id: 't1', title: 'Task', state: 'TO-DO', description: '' },
    ])
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

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.getAllByTestId('comment-item').length).toBe(1)
    expect(screen.getAllByTestId('reply-item').length).toBe(1)
  })

  it('dismiss via X button', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

    await fireEvent.click(screen.getByTestId('close-btn'))
    await tick()
    expect(screen.queryByTestId('task-detail-rail')).toBeNull()
  })

  it('dismisses on background click', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(BackgroundClickWrapper, { props: { selection, tasks, comments } })
    expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

    await fireEvent.click(screen.getByTestId('board-panel'))
    await tick()
    expect(screen.queryByTestId('task-detail-rail')).toBeNull()
  })

  it('does not dismiss on task-card click (BUG-002)', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'Task One', state: 'TO-DO', description: '' },
      { id: 'task-2', title: 'Task Two', state: 'IN-PROGRESS', description: '' },
    ])
    const comments = createMockCommentsStore([])

    const { container } = render(BackgroundClickWrapper, { props: { selection, tasks, comments } })
    await tick()
    expect(container.querySelector('[data-testid="task-detail-rail"]')).toBeTruthy()

    await fireEvent.click(screen.getByTestId('task-card'))
    await tick()
    expect(container.querySelector('[data-testid="task-detail-rail"]')).toBeTruthy()
    expect(selection.selectedId).toBe('task-2')
  })
})
