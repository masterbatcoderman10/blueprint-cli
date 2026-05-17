// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import Filters from '../../../src/tracker/spa/components/Filters.svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'

describe('R6-2.A.2: Filters', () => {
  it('renders Phase and Stream dropdowns', () => {
    render(Filters, { props: { tasks: [] } })
    expect(screen.getByLabelText('Phase')).toBeInTheDocument()
    expect(screen.getByLabelText('Stream')).toBeInTheDocument()
  })

  it('calls onFilterChange when Phase selection changes', async () => {
    const onFilterChange = vi.fn()
    const tasks: TaskData[] = [
      { id: '1', phase: 'P1', stream: 'A' },
      { id: '2', phase: 'P2', stream: 'B' },
    ]
    render(Filters, { props: { tasks, onFilterChange } })

    const phaseSelect = screen.getByLabelText('Phase')
    await fireEvent.change(phaseSelect, { target: { value: 'P2' } })

    expect(onFilterChange).toHaveBeenCalledWith({ phase: 'P2', stream: undefined })
  })

  it('calls onFilterChange when Stream selection changes', async () => {
    const onFilterChange = vi.fn()
    const tasks: TaskData[] = [
      { id: '1', phase: 'P1', stream: 'A' },
      { id: '2', phase: 'P2', stream: 'B' },
    ]
    render(Filters, { props: { tasks, onFilterChange } })

    const streamSelect = screen.getByLabelText('Stream')
    await fireEvent.change(streamSelect, { target: { value: 'B' } })

    expect(onFilterChange).toHaveBeenCalledWith({ phase: undefined, stream: 'B' })
  })

  it('derives options from unique task values', () => {
    const tasks: TaskData[] = [
      { id: '1', phase: 'P1', stream: 'A' },
      { id: '2', phase: 'P1', stream: 'A' },
      { id: '3', phase: 'P2', stream: 'B' },
    ]
    render(Filters, { props: { tasks } })

    const phaseSelect = screen.getByLabelText('Phase')
    const streamSelect = screen.getByLabelText('Stream')

    expect(phaseSelect.querySelectorAll('option').length).toBe(3) // All Phases + P1 + P2
    expect(streamSelect.querySelectorAll('option').length).toBe(3) // All Streams + A + B
  })

  it('includes empty All option when no tasks', () => {
    render(Filters, { props: { tasks: [] } })

    const phaseSelect = screen.getByLabelText('Phase')
    const streamSelect = screen.getByLabelText('Stream')

    expect(phaseSelect.querySelectorAll('option').length).toBe(1)
    expect(streamSelect.querySelectorAll('option').length).toBe(1)
  })
})
