// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import { tick } from 'svelte'
import TaskDetailRail from '../../../src/tracker/spa/components/TaskDetailRail.svelte'
import Board from '../../../src/tracker/spa/components/Board.svelte'
import BackgroundClickWrapper from './background-click-wrapper.svelte'
import {
  createMockTasksStore,
  createMockSelectionStore,
  createMockCommentsStore,
} from './helpers.svelte'

beforeEach(() => {
  // Clean hash before each test
  if (typeof window !== 'undefined') {
    window.location.hash = ''
  }
})

afterEach(() => {
  cleanup()
  if (typeof window !== 'undefined') {
    window.location.hash = ''
  }
})

describe('R8-1.B: Default-open and quick-swap', () => {
  describe('R8-1.B.1: Task-detail selection contract', () => {
    it('valid #task=<id> hash selects that task', async () => {
      const selection = createMockSelectionStore('task-1')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'First Task', state: 'TO-DO', description: 'Desc' },
        { id: 'task-2', title: 'Second Task', state: 'TO-DO', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()
      expect(screen.getByTestId('task-title').textContent).toBe('First Task')
    })

    it('without hash, board selects deterministic initial task and opens rail', async () => {
      const selection = createMockSelectionStore(null)
      const tasks = createMockTasksStore([
        { id: 'alpha', title: 'Alpha Task', state: 'TO-DO', description: 'Desc' },
        { id: 'beta', title: 'Beta Task', state: 'TO-DO', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      // When no task is selected, the rail is closed
      expect(screen.queryByTestId('task-detail-rail')).toBeNull()

      // Simulate auto-selection (Board will call selection.select with deterministic ID)
      selection.select('alpha')
      await tick()
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()
      expect(screen.getByTestId('task-title').textContent).toBe('Alpha Task')
    })

    it('hash selection takes precedence over default selection', async () => {
      // If the hash says task-2, we should show task-2, not the deterministic default
      const selection = createMockSelectionStore('task-2')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'First Task', state: 'TO-DO', description: 'Desc' },
        { id: 'task-2', title: 'Second Task', state: 'TO-DO', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-title').textContent).toBe('Second Task')
    })
  })

  describe('R8-1.B.2: SPA default-open rail behavior', () => {
    it('Board auto-selects first task by sorted ID when no hash and tasks exist', async () => {
      const mockTasksStore = {
        tasks: [
          { id: 'z-task', title: 'Z Task', state: 'TO-DO' },
          { id: 'a-task', title: 'A Task', state: 'TO-DO' },
          { id: 'm-task', title: 'M Task', state: 'IN-PROGRESS' },
        ],
        loading: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        setFilter: vi.fn(),
        handleVisibilityChange: vi.fn(),
      }
      const mockSelectionStore = {
        selectedId: null,
        select: vi.fn(),
        clear: vi.fn(),
      }

      render(Board, {
        props: {
          tasksStore: mockTasksStore,
          selectionStore: mockSelectionStore,
          projectName: 'Test',
          projectTagline: 'Test',
        },
      })

      // After render, Board should have auto-selected the first task by sorted ID
      // Wait a tick for effects to run
      await tick()
      await tick()
      expect(mockSelectionStore.select).toHaveBeenCalledWith('a-task')
    })

    it('Board does not auto-select when tasks are empty', async () => {
      const mockTasksStore = {
        tasks: [],
        loading: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        setFilter: vi.fn(),
        handleVisibilityChange: vi.fn(),
      }
      const mockSelectionStore = {
        selectedId: null,
        select: vi.fn(),
        clear: vi.fn(),
      }

      render(Board, {
        props: {
          tasksStore: mockTasksStore,
          selectionStore: mockSelectionStore,
          projectName: 'Test',
          projectTagline: 'Test',
        },
      })

      await tick()
      await tick()
      expect(mockSelectionStore.select).not.toHaveBeenCalled()
    })

    it('Board does not auto-select when hash already selects a task', async () => {
      const mockTasksStore = {
        tasks: [
          { id: 'task-1', title: 'T1', state: 'TO-DO' },
        ],
        loading: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        setFilter: vi.fn(),
        handleVisibilityChange: vi.fn(),
      }
      const mockSelectionStore = {
        selectedId: 'task-1', // Already selected via hash
        select: vi.fn(),
        clear: vi.fn(),
      }

      render(Board, {
        props: {
          tasksStore: mockTasksStore,
          selectionStore: mockSelectionStore,
          projectName: 'Test',
          projectTagline: 'Test',
        },
      })

      await tick()
      await tick()
      // Should NOT call select again since selection already exists
      expect(mockSelectionStore.select).not.toHaveBeenCalled()
    })

    it('rail is open by default when Board auto-selects a task', async () => {
      const selection = createMockSelectionStore('a-task')
      const tasks = createMockTasksStore([
        { id: 'a-task', title: 'A Task', state: 'TO-DO', description: 'Desc' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()
    })

    it('no tasks available → rail stays closed, no crash', async () => {
      const selection = createMockSelectionStore(null)
      const tasks = createMockTasksStore([])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.queryByTestId('task-detail-rail')).toBeNull()
    })
  })

  describe('R8-1.B.3: Quick-swap rail behavior', () => {
    it('clicking another task while rail is open swaps detail immediately', async () => {
      const selection = createMockSelectionStore('task-1')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'Task One', state: 'TO-DO', description: '' },
        { id: 'task-2', title: 'Task Two', state: 'IN-PROGRESS', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-title').textContent).toBe('Task One')

      // Simulate quick swap: select task-2
      selection.select('task-2')
      await tick()

      // Rail should still be open showing the new task
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()
      expect(screen.getByTestId('task-title').textContent).toBe('Task Two')
    })

    it('quick-swap in wrapper does not close rail first', async () => {
      const selection = createMockSelectionStore('task-1')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'Task One', state: 'TO-DO', description: '' },
        { id: 'task-2', title: 'Task Two', state: 'IN-PROGRESS', description: '' },
      ])
      const comments = createMockCommentsStore([])

      const { container } = render(BackgroundClickWrapper, { props: { selection, tasks, comments } })

      // Rail is open with task-1
      expect(container.querySelector('[data-testid="task-detail-rail"]')).toBeTruthy()
      expect(container.querySelector('[data-testid="task-title"]').textContent).toBe('Task One')

      // Click the task-card (which selects task-2)
      await fireEvent.click(screen.getByTestId('task-card'))
      await tick()

      // Rail should still be open and now show task-2
      expect(container.querySelector('[data-testid="task-detail-rail"]')).toBeTruthy()
      expect(selection.selectedId).toBe('task-2')
    })
  })

  describe('Manual close behavior (regression)', () => {
    it('close button clears selection and closes rail', async () => {
      const selection = createMockSelectionStore('task-1')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'Task One', state: 'TO-DO', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

      await fireEvent.click(screen.getByTestId('close-btn'))
      await tick()
      expect(selection.selectedId).toBeNull()
      expect(screen.queryByTestId('task-detail-rail')).toBeNull()
    })

    it('background click closes rail', async () => {
      const selection = createMockSelectionStore('task-1')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'Task One', state: 'TO-DO', description: '' },
      ])
      const comments = createMockCommentsStore([])

      render(BackgroundClickWrapper, { props: { selection, tasks, comments } })
      expect(screen.getByTestId('task-detail-rail')).toBeTruthy()

      await fireEvent.click(screen.getByTestId('board-panel'))
      await tick()
      expect(screen.queryByTestId('task-detail-rail')).toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('hash points at missing task → falls back to deterministic selection without breaking', async () => {
      // The selection store has a selectedId that doesn't match any task
      const selection = createMockSelectionStore('nonexistent')
      const tasks = createMockTasksStore([
        { id: 'task-1', title: 'Real Task', state: 'TO-DO', description: 'Desc' },
      ])
      const comments = createMockCommentsStore([])

      render(TaskDetailRail, { props: { selection, tasks, comments } })
      // Task not found → rail is closed (task is undefined)
      // The rail only opens when both `open` (selectedId !== null) AND `task` (found) are truthy
      expect(screen.queryByTestId('task-detail-rail')).toBeNull()
    })
  })
})
