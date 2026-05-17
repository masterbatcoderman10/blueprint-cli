// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'
import type { TasksStore } from '../../../src/tracker/spa/stores/tasks.svelte'
import type { SelectionStore } from '../../../src/tracker/spa/stores/selection.svelte'

describe('R6-2.A.6: Board end-to-end', () => {
  let mockTasksStore: TasksStore
  let mockSelectionStore: SelectionStore

  const seededTasks: TaskData[] = [
    { id: 't1', title: 'Todo One', status: 'todo', phase: 'P2', stream: 'A', gate: '1' },
    { id: 't2', title: 'Todo Two', status: 'todo', phase: 'P2', stream: 'A', gate: '2' },
    { id: 't3', title: 'In Progress One', status: 'in-progress', phase: 'P2', stream: 'B', gate: '1' },
    { id: 't4', title: 'In Review One', status: 'in-review', phase: 'P2', stream: 'C', gate: '1' },
    { id: 't5', title: 'Rework One', status: 'rework', phase: 'P2', stream: 'D', gate: '1' },
    { id: 't6', title: 'Done One', status: 'done', phase: 'P2', stream: 'A', gate: '1' },
    { id: 't7', title: 'Done Two', status: 'done', phase: 'P2', stream: 'B', gate: '2' },
    { id: 't8', title: 'Done Three', status: 'done', phase: 'P2', stream: 'C', gate: '3' },
  ]

  beforeEach(() => {
    mockTasksStore = {
      tasks: seededTasks,
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

  it('Header shows project info and correct counts from tasks', async () => {
    const { default: Board } = await import('../../../src/tracker/spa/components/Board.svelte')
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
        projectName: 'E2E Project',
        projectTagline: 'E2E Tagline',
      },
    })
    expect(screen.getByTestId('project-name')).toHaveTextContent('E2E Project')
    expect(screen.getByTestId('milestone-count')).toHaveTextContent('1')
    expect(screen.getByTestId('phase-count')).toHaveTextContent('1')
    expect(screen.getByTestId('stream-count')).toHaveTextContent('4')
  })

  it('Filters dropdown change propagates to tasks store', async () => {
    const { default: Board } = await import('../../../src/tracker/spa/components/Board.svelte')
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
      },
    })
    const streamSelect = screen.getByLabelText('Stream')
    await fireEvent.change(streamSelect, { target: { value: 'A' } })
    expect(mockTasksStore.setFilter).toHaveBeenCalledWith({ phase: undefined, stream: 'A' })
  })

  it('TaskCard click writes to selection store', async () => {
    const { default: Board } = await import('../../../src/tracker/spa/components/Board.svelte')
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
      },
    })
    const cards = screen.getAllByTestId('task-card')
    await fireEvent.click(cards[0])
    expect(mockSelectionStore.select).toHaveBeenCalledWith('t1')
  })

  it('Column partitioning renders tasks in correct columns', async () => {
    const { default: Board } = await import('../../../src/tracker/spa/components/Board.svelte')
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
      },
    })
    // Verify counts via hidden data-testid spans
    expect(screen.getByTestId('column-count-todo')).toHaveTextContent('2')
    expect(screen.getByTestId('column-count-in-progress')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-in-review')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-rework')).toHaveTextContent('1')
    expect(screen.getByTestId('column-count-done')).toHaveTextContent('3')
  })

  it('Done column collapse shows toggle and expands on click', async () => {
    const { default: Board } = await import('../../../src/tracker/spa/components/Board.svelte')
    render(Board, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
      },
    })
    // Done column should initially show 2 cards + toggle
    const doneColumn = screen.getByTestId('column-done')
    const cardsInDone = doneColumn.querySelectorAll('[data-testid="task-card"]')
    expect(cardsInDone.length).toBe(2)
    const toggle = doneColumn.querySelector('[data-testid="done-toggle"]')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveTextContent('+ 1 more completed')

    await fireEvent.click(toggle!)
    const expandedCards = doneColumn.querySelectorAll('[data-testid="task-card"]')
    expect(expandedCards.length).toBe(3)
  })

  it('Board fetches project on mount when no project props provided', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: { name: 'Auto Project', description: 'Auto Tagline' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { default: DynamicBoard } = await import(
      '../../../src/tracker/spa/components/Board.svelte'
    )
    render(DynamicBoard, {
      props: {
        tasksStore: mockTasksStore,
        selectionStore: mockSelectionStore,
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('project-name')).toHaveTextContent('Auto Project')
    })
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('Auto Tagline')
  })
})
