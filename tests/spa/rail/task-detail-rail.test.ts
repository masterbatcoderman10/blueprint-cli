// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import TaskDetailRail from '../../../src/tracker/spa/components/TaskDetailRail.svelte'
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

describe('R6-2.B.1: TaskDetailRail', () => {
  it('is closed when selection is null', () => {
    const selection = createMockSelectionStore(null)
    const tasks = createMockTasksStore([])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.queryByTestId('task-detail-rail')).toBeNull()
  })

  it('opens when a task is selected', () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'Test Task', state: 'IN-PROGRESS', description: 'Desc' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.getByTestId('task-detail-rail')).toBeTruthy()
  })

  it('shows status dot color for IN-PROGRESS (orange)', () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'IN-PROGRESS', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const dot = screen.getByTestId('status-dot')
    expect(dot.getAttribute('style')).toContain('background-color: rgb(249, 115, 22)')
  })

  it('shows status dot color for DONE (green)', () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'DONE', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const dot = screen.getByTestId('status-dot')
    expect(dot.getAttribute('style')).toContain('background-color: rgb(34, 197, 94)')
  })

  it('shows status dot color for TO-DO (gray)', () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const dot = screen.getByTestId('status-dot')
    expect(dot.getAttribute('style')).toContain('background-color: rgb(107, 101, 96)')
  })

  it('enters edit mode on description click', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Original desc' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    const desc = screen.getByTestId('desc-text')
    await fireEvent.click(desc)

    expect(screen.queryByTestId('desc-text')).toBeNull()
    const textarea = screen.getByTestId('desc-textarea')
    expect((textarea as HTMLTextAreaElement).value).toBe('Original desc')
  })

  it('saves description on Cmd+Enter with PATCH', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { id: 'task-1', description: 'Updated desc' } }),
    })

    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Original desc' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    await fireEvent.click(screen.getByTestId('desc-text'))

    const textarea = screen.getByTestId('desc-textarea')
    await fireEvent.input(textarea, { target: { value: 'Updated desc' } })
    await fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/task-1'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
  })

  it('cancels on Escape without PATCH', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Original desc' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    await fireEvent.click(screen.getByTestId('desc-text'))

    const textarea = screen.getByTestId('desc-textarea')
    await fireEvent.input(textarea, { target: { value: 'Changed' } })
    await fireEvent.keyDown(textarea, { key: 'Escape' })

    expect(screen.getByTestId('desc-text').textContent).toContain('Original desc')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('no-op on clean blur (no PATCH)', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: 'Same desc' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    await fireEvent.click(screen.getByTestId('desc-text'))

    const textarea = screen.getByTestId('desc-textarea')
    // blur without changing
    await fireEvent.blur(textarea)

    expect(screen.getByTestId('desc-text').textContent).toContain('Same desc')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('dismisses via header X button', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

    await fireEvent.click(screen.getByTestId('close-btn'))
    expect(selection.selectedId).toBeNull()
  })

  it('loads comments when selection changes', async () => {
    const selection = createMockSelectionStore('task-1')
    const tasks = createMockTasksStore([
      { id: 'task-1', title: 'T', state: 'TO-DO', description: '' },
    ])
    const comments = createMockCommentsStore([])
    const loadSpy = vi.spyOn(comments, 'loadForTask')

    render(TaskDetailRail, { props: { selection, tasks, comments } })
    expect(loadSpy).toHaveBeenCalledWith('task-1')
  })
})
