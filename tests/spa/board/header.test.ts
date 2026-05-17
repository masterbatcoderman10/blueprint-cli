// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/svelte'
import Header from '../../../src/tracker/spa/components/Header.svelte'
import type { TaskData } from '../../../src/tracker/spa/lib/api.js'

describe('R6-2.A.1: Header', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders project name and tagline from props', () => {
    render(Header, {
      props: {
        projectName: 'blueprint-controls',
        projectTagline: 'Operational source of truth',
        tasks: [],
      },
    })
    expect(screen.getByTestId('project-name')).toHaveTextContent('blueprint-controls')
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('Operational source of truth')
  })

  it('shows fallback — when project data is missing', () => {
    render(Header, { props: { tasks: [] } })
    expect(screen.getByTestId('project-name')).toHaveTextContent('—')
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('—')
  })

  it('derives milestone/phase/stream counts from tasks', () => {
    const tasks: TaskData[] = [
      { id: 'R6-2.A.1', phase: 'P2', stream: 'A', status: 'todo' },
      { id: 'R6-2.A.2', phase: 'P2', stream: 'A', status: 'todo' },
      { id: 'R6-2.B.1', phase: 'P2', stream: 'B', status: 'in-progress' },
      { id: 'R6-3.A.1', phase: 'P3', stream: 'A', status: 'todo' },
    ]
    render(Header, {
      props: { projectName: 'Test', projectTagline: 'Tagline', tasks },
    })
    expect(screen.getByTestId('milestone-count')).toHaveTextContent('1')
    expect(screen.getByTestId('phase-count')).toHaveTextContent('2')
    expect(screen.getByTestId('stream-count')).toHaveTextContent('2')
  })

  it('shows zero counts when tasks array is empty', () => {
    render(Header, {
      props: { projectName: 'Test', projectTagline: 'Tagline', tasks: [] },
    })
    expect(screen.getByTestId('phase-count')).toHaveTextContent('0')
    expect(screen.getByTestId('stream-count')).toHaveTextContent('0')
  })

  it('fetches project on mount via getProject when props are not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: { name: 'Fetched Project', description: 'Fetched tagline' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    // Must dynamically import after stubbing fetch so the api module uses the stub
    const { default: DynamicHeader } = await import(
      '../../../src/tracker/spa/components/Header.svelte'
    )
    render(DynamicHeader, { props: { tasks: [] } })

    // Initially shows fallback while loading
    expect(screen.getByTestId('project-name')).toHaveTextContent('—')

    // After fetch resolves
    await waitFor(() => {
      expect(screen.getByTestId('project-name')).toHaveTextContent('Fetched Project')
    })
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('Fetched tagline')
  })

  it('shows fallback — on getProject error', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: { code: 'ERR', message: 'fail' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { default: DynamicHeader } = await import(
      '../../../src/tracker/spa/components/Header.svelte'
    )
    render(DynamicHeader, { props: { tasks: [] } })

    await waitFor(() => {
      expect(screen.getByTestId('project-name')).toHaveTextContent('—')
    })
    expect(screen.getByTestId('project-tagline')).toHaveTextContent('—')
  })
})
