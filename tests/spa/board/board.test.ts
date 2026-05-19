// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import Board from '../../../src/tracker/spa/components/Board.svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'
import type { TasksStore } from '../../../src/tracker/spa/stores/tasks.svelte'
import type { SelectionStore } from '../../../src/tracker/spa/stores/selection.svelte'

describe('R6-2.A.5: Board', () => {
  let mockTasksStore: TasksStore
  let mockSelectionStore: SelectionStore

  const allStatesTasks: TaskData[] = [
    { id: 't1', title: 'Todo 1', state: 'TO-DO', phase: 'P2', stream: 'A', gate: '1' },
    { id: 't2', title: 'Todo 2', state: 'TO-DO', phase: 'P2', stream: 'A', gate: '2' },
    { id: 't3', title: 'In Progress 1', state: 'IN-PROGRESS', phase: 'P2', stream: 'B', gate: '1' },
    { id: 't4', title: 'In Review 1', state: 'IN-REVIEW', phase: 'P2', stream: 'C', gate: '1' },
    { id: 't5', title: 'Rework 1', state: 'REWORK', phase: 'P2', stream: 'D', gate: '1' },
    { id: 't6', title: 'Done 1', state: 'DONE', phase: 'P2', stream: 'A', gate: '1' },
    { id: 't7', title: 'Done 2', state: 'DONE', phase: 'P2', stream: 'B', gate: '2' },
    { id: 't8', title: 'Done 3', state: 'DONE', phase: 'P2', stream: 'C', gate: '3' },
  ]

  beforeEach(() => {
    mockTasksStore = {
      tasks: allStatesTasks,
      loading: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      setFilter: vi.fn(),
      handleVisibilityChange: vi.fn(),
    }
    mockSelectionStore = {
      selectedId: null,
      select: vi.fn(),
      clear: vi.fn(),
    }
  })

  it('renders Header with project name from props', () => {
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
        projectName: 'Test Project',
        projectTagline: 'Test Tagline',
      },
    })
    expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project')
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('Test Tagline')
  })

  it('partitions tasks into 5 columns', () => {
    render(Board, {
      props: { tasksStore: mockTasksStore, selectionStore: mockSelectionStore },
    })
    expect(screen.getByTestId('column-count-todo')).toHaveTextContent('2')
    expect(screen.getByTestId('column-count-in-progress')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-in-review')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-rework')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-done')).toHaveTextContent('3')
  })

  it('passes filter changes to tasks store', async () => {
    render(Board, {
      props: { tasksStore: mockTasksStore, selectionStore: mockSelectionStore },
    })
    await fireEvent.click(screen.getByLabelText('Phase'))
    await fireEvent.click(screen.getByRole('button', { name: 'P2' }))
    expect(mockTasksStore.setFilter).toHaveBeenCalledWith({ milestone: undefined, phase: 'P2', stream: undefined })
  })

  it('calls selectionStore.select when a task card is clicked', async () => {
    render(Board, {
      props: { tasksStore: mockTasksStore, selectionStore: mockSelectionStore },
    })
    const cards = screen.getAllByTestId('task-card')
    await fireEvent.click(cards[0])
    expect(mockSelectionStore.select).toHaveBeenCalledWith('t1')
  })

  it('starts and stops the tasks store lifecycle', () => {
    const { unmount } = render(Board, {
      props: { tasksStore: mockTasksStore, selectionStore: mockSelectionStore },
    })
    expect(mockTasksStore.start).toHaveBeenCalled()
    unmount()
    expect(mockTasksStore.stop).toHaveBeenCalled()
  })
})
