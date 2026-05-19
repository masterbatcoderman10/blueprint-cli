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

    expect(onFilterChange).toHaveBeenCalledWith({ milestone: undefined, phase: 'P2', stream: undefined })
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

    expect(onFilterChange).toHaveBeenCalledWith({ milestone: undefined, phase: undefined, stream: 'B' })
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

describe('R6-5.B.3: Milestone dropdown', () => {
  // T-R6-5.B.3.1 — Milestone dropdown positioned left of Phase dropdown
  it('renders Milestone dropdown to the left of Phase dropdown', () => {
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
    ]
    render(Filters, { props: { tasks } })

    const milestoneSelect = screen.getByLabelText('Milestone')
    const phaseSelect = screen.getByLabelText('Phase')
    expect(milestoneSelect).toBeInTheDocument()
    expect(phaseSelect).toBeInTheDocument()

    // DOM order: Milestone select comes before Phase select
    const selects = document.querySelectorAll('select')
    const milestoneIdx = Array.from(selects).indexOf(milestoneSelect)
    const phaseIdx = Array.from(selects).indexOf(phaseSelect)
    expect(milestoneIdx).toBeLessThan(phaseIdx)
  })

  // T-R6-5.B.3.2 — Milestone dropdown lists unique milestones sorted alphabetically
  it('lists unique milestones from the task set sorted alphabetically', () => {
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'R6-2.B.1', phase: 'R6-2', stream: 'B', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
      { id: 'M2-1.0.1', phase: 'M2-1', stream: '0', milestone: 'M2' },
    ]
    render(Filters, { props: { tasks } })

    const milestoneSelect = screen.getByLabelText('Milestone')
    const options = Array.from(milestoneSelect.querySelectorAll('option'))
    // First option is "All Milestones", then sorted: M1, M2, R6
    const values = options.map((o) => o.value)
    expect(values).toEqual(['', 'M1', 'M2', 'R6'])
  })

  // T-R6-5.B.3.3 — Milestone change emits full filter triple
  it('emits { milestone, phase, stream } on milestone change', async () => {
    const onFilterChange = vi.fn()
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
    ]
    render(Filters, { props: { tasks, onFilterChange } })

    const milestoneSelect = screen.getByLabelText('Milestone')
    await fireEvent.change(milestoneSelect, { target: { value: 'R6' } })

    expect(onFilterChange).toHaveBeenCalledWith({
      milestone: 'R6',
      phase: undefined,
      stream: undefined,
    })
  })
})
