// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import Column from '../../../src/tracker/spa/components/Column.svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'

describe('R6-2.A.4: Column', () => {
  const todoColumn = { id: 'todo', label: 'To Do', dot: '#6B6560' }
  const doneColumn = { id: 'done', label: 'Done', dot: '#22C55E' }

  const makeTasks = (count: number, status: string): TaskData[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}`,
      status,
      phase: 'P2',
      stream: 'A',
      gate: `${i + 1}`,
    }))

  it('renders column title and count badge', () => {
    const tasks = makeTasks(3, 'todo')
    render(Column, { props: { column: todoColumn, tasks } })
    expect(screen.getByTestId('column-title')).toHaveTextContent('To Do')
    expect(screen.getByTestId('column-count')).toHaveTextContent('3')
  })

  it('shows empty state for todo column', () => {
    render(Column, { props: { column: todoColumn, tasks: [] } })
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No tasks waiting')
  })

  it('shows empty state for in-progress column', () => {
    render(Column, {
      props: { column: { id: 'in-progress', label: 'In Progress', dot: '#F97316' }, tasks: [] },
    })
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Nothing in progress')
  })

  it('shows empty state for in-review column', () => {
    render(Column, {
      props: { column: { id: 'in-review', label: 'In Review', dot: '#A78BFA' }, tasks: [] },
    })
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Nothing under review')
  })

  it('shows empty state for rework column', () => {
    render(Column, {
      props: { column: { id: 'rework', label: 'Rework', dot: '#EC4899' }, tasks: [] },
    })
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Review rejections land here')
  })

  it('shows empty state for done column', () => {
    render(Column, { props: { column: doneColumn, tasks: [] } })
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No completed tasks yet')
  })

  it('renders task cards in order', () => {
    const tasks = makeTasks(3, 'todo')
    render(Column, { props: { column: todoColumn, tasks } })
    const cards = screen.getAllByTestId('task-card')
    expect(cards.length).toBe(3)
  })

  it('calls onSelect when a task card is clicked', async () => {
    const onSelect = vi.fn()
    const tasks = makeTasks(2, 'todo')
    render(Column, { props: { column: todoColumn, tasks, onSelect } })
    const cards = screen.getAllByTestId('task-card')
    await fireEvent.click(cards[0])
    expect(onSelect).toHaveBeenCalledWith('task-1')
  })

  describe('done column collapse', () => {
    it('shows only first 2 done cards when more than 2 exist', () => {
      const tasks = makeTasks(5, 'done')
      render(Column, { props: { column: doneColumn, tasks } })
      const cards = screen.getAllByTestId('task-card')
      expect(cards.length).toBe(2)
      expect(screen.getByTestId('done-toggle')).toHaveTextContent('+ 3 more completed')
    })

    it('expands to show all done cards when toggle is clicked', async () => {
      const tasks = makeTasks(5, 'done')
      render(Column, { props: { column: doneColumn, tasks } })
      const toggle = screen.getByTestId('done-toggle')
      await fireEvent.click(toggle)
      const cards = screen.getAllByTestId('task-card')
      expect(cards.length).toBe(5)
    })

    it('does not show toggle when 2 or fewer done tasks', () => {
      const tasks = makeTasks(2, 'done')
      render(Column, { props: { column: doneColumn, tasks } })
      const cards = screen.getAllByTestId('task-card')
      expect(cards.length).toBe(2)
      expect(screen.queryByTestId('done-toggle')).not.toBeInTheDocument()
    })
  })
})
