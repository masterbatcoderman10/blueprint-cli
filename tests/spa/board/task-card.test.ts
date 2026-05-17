// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import TaskCard from '../../../src/tracker/spa/components/TaskCard.svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'

describe('R6-2.A.3: TaskCard', () => {
  const baseTask: TaskData = {
    id: 'R6-2.A.1',
    title: 'Build shared Kanban board primitives',
    status: 'todo',
    phase: 'P2',
    stream: 'A',
    gate: '1',
  }

  it('renders task title', () => {
    render(TaskCard, { props: { task: baseTask } })
    expect(screen.getByText('Build shared Kanban board primitives')).toBeInTheDocument()
  })

  it('renders stream chip with per-letter color', () => {
    render(TaskCard, { props: { task: baseTask } })
    const chip = screen.getByTestId('stream-chip')
    expect(chip).toHaveTextContent('Stream A')
    expect(chip).toHaveStyle('background-color: rgb(107, 101, 96)')
  })

  it('renders gate chip in green', () => {
    render(TaskCard, { props: { task: baseTask } })
    const chip = screen.getByTestId('gate-chip')
    expect(chip).toHaveTextContent('1')
    expect(chip).toHaveStyle('background-color: rgb(34, 197, 94)')
  })

  it('renders task ID', () => {
    render(TaskCard, { props: { task: baseTask } })
    expect(screen.getByTestId('task-id')).toHaveTextContent('R6-2.A.1')
  })

  it('calls onSelect with task id when clicked', async () => {
    const onSelect = vi.fn()
    render(TaskCard, { props: { task: baseTask, onSelect } })
    const card = screen.getByTestId('task-card')
    await fireEvent.click(card)
    expect(onSelect).toHaveBeenCalledWith('R6-2.A.1')
  })

  it('uses different colors for different stream letters', () => {
    const taskB: TaskData = { ...baseTask, stream: 'B' }
    render(TaskCard, { props: { task: taskB } })
    const chip = screen.getByTestId('stream-chip')
    expect(chip).toHaveTextContent('Stream B')
    expect(chip).not.toHaveStyle('background-color: rgb(107, 101, 96)')
  })
})
