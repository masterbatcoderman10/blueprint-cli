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

    await fireEvent.click(screen.getByLabelText('Phase'))
    await fireEvent.click(screen.getByRole('button', { name: 'P2' }))

    expect(onFilterChange).toHaveBeenCalledWith({ milestone: undefined, phase: 'P2', stream: undefined })
  })

  it('calls onFilterChange when Stream selection changes', async () => {
    const onFilterChange = vi.fn()
    const tasks: TaskData[] = [
      { id: '1', phase: 'P1', stream: 'A' },
      { id: '2', phase: 'P2', stream: 'B' },
    ]
    render(Filters, { props: { tasks, onFilterChange } })

    await fireEvent.click(screen.getByLabelText('Stream'))
    await fireEvent.click(screen.getByRole('button', { name: 'B' }))

    expect(onFilterChange).toHaveBeenCalledWith({ milestone: undefined, phase: undefined, stream: 'B' })
  })

  it('derives options from unique task values', async () => {
    const tasks: TaskData[] = [
      { id: '1', phase: 'P1', stream: 'A' },
      { id: '2', phase: 'P1', stream: 'A' },
      { id: '3', phase: 'P2', stream: 'B' },
    ]
    render(Filters, { props: { tasks } })

    // Open Phase dropdown — All Phases + P1 + P2 = 3 option buttons
    await fireEvent.click(screen.getByLabelText('Phase'))
    expect(screen.getAllByRole('button', { name: /All Phases|P1|P2/ }).length).toBe(3)

    // Close Phase, open Stream — All Streams + A + B = 3 option buttons
    await fireEvent.click(screen.getByLabelText('Phase'))
    await fireEvent.click(screen.getByLabelText('Stream'))
    expect(screen.getAllByRole('button', { name: /All Streams|^A$|^B$/ }).length).toBe(3)
  })

  it('includes empty All option when no tasks', async () => {
    render(Filters, { props: { tasks: [] } })

    await fireEvent.click(screen.getByLabelText('Phase'))
    expect(screen.getByRole('button', { name: 'All Phases' })).toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Phase'))
    await fireEvent.click(screen.getByLabelText('Stream'))
    expect(screen.getByRole('button', { name: 'All Streams' })).toBeInTheDocument()
  })
})

describe('R6-5.B.3: Milestone dropdown', () => {
  it('renders Milestone dropdown to the left of Phase dropdown', () => {
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
    ]
    render(Filters, { props: { tasks } })

    const milestoneBtn = screen.getByLabelText('Milestone')
    const phaseBtn = screen.getByLabelText('Phase')
    expect(milestoneBtn).toBeInTheDocument()
    expect(phaseBtn).toBeInTheDocument()

    const buttons = document.querySelectorAll('button[aria-label]')
    const milestoneIdx = Array.from(buttons).indexOf(milestoneBtn as HTMLButtonElement)
    const phaseIdx = Array.from(buttons).indexOf(phaseBtn as HTMLButtonElement)
    expect(milestoneIdx).toBeLessThan(phaseIdx)
  })

  it('lists unique milestones from the task set sorted alphabetically', async () => {
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'R6-2.B.1', phase: 'R6-2', stream: 'B', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
      { id: 'M2-1.0.1', phase: 'M2-1', stream: '0', milestone: 'M2' },
    ]
    render(Filters, { props: { tasks } })

    await fireEvent.click(screen.getByLabelText('Milestone'))
    const options = screen.getAllByRole('button', { name: /All Milestones|^M1$|^M2$|^R6$/ })
    const names = options.map((o) => o.textContent?.trim())
    expect(names).toEqual(['All Milestones', 'M1', 'M2', 'R6'])
  })

  it('emits { milestone, phase, stream } on milestone change', async () => {
    const onFilterChange = vi.fn()
    const tasks: TaskData[] = [
      { id: 'R6-1.A.1', phase: 'R6-1', stream: 'A', milestone: 'R6' },
      { id: 'M1-1.0.1', phase: 'M1-1', stream: '0', milestone: 'M1' },
    ]
    render(Filters, { props: { tasks, onFilterChange } })

    await fireEvent.click(screen.getByLabelText('Milestone'))
    await fireEvent.click(screen.getByRole('button', { name: 'R6' }))

    expect(onFilterChange).toHaveBeenCalledWith({
      milestone: 'R6',
      phase: undefined,
      stream: undefined,
    })
  })
})
