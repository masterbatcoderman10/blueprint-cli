// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import CommentComposer from '../../../src/tracker/spa/components/CommentComposer.svelte'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('R6-2.B.2: CommentComposer', () => {
  it('renders with MAJOR severity preset', () => {
    render(CommentComposer, { props: { taskId: 't1', severity: 'MAJOR' } })
    expect(screen.getByTestId('comment-composer')).toBeTruthy()
    const chip = screen.getByText('MAJOR')
    expect(chip).toBeTruthy()
  })

  it('renders with MINOR severity preset', () => {
    render(CommentComposer, { props: { taskId: 't1', severity: 'MINOR' } })
    expect(screen.getByText('MINOR')).toBeTruthy()
  })

  it('submits MAJOR comment with body and line', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, data: { id: 'c1' } }),
    })

    const onSubmitted = vi.fn()
    render(CommentComposer, {
      props: { taskId: 't1', severity: 'MAJOR', onSubmitted },
    })

    const lineInput = screen.getByTestId('composer-line')
    const bodyInput = screen.getByTestId('composer-body')
    const submitBtn = screen.getByTestId('composer-submit')

    await fireEvent.input(lineInput, { target: { value: '42' } })
    await fireEvent.input(bodyInput, { target: { value: 'This is a major issue' } })
    await fireEvent.click(submitBtn)

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/t1/comments'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('MAJOR'),
        }),
      )
    })

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(calledBody.severity).toBe('MAJOR')
    expect(calledBody.body).toBe('This is a major issue')
    expect(calledBody.line).toBe('42')
    expect(calledBody.parent_id).toBeNull()
    expect(onSubmitted).toHaveBeenCalled()
  })

  it('submits reply with parent_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, data: { id: 'c2' } }),
    })

    render(CommentComposer, {
      props: { taskId: 't1', parentId: 'parent-1', severity: 'MINOR' },
    })

    const bodyInput = screen.getByTestId('composer-body')
    await fireEvent.input(bodyInput, { target: { value: 'Reply body' } })
    await fireEvent.click(screen.getByTestId('composer-submit'))

    await vi.waitFor(() => {
      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(calledBody.parent_id).toBe('parent-1')
    })
  })

  it('shows inline error on invalid_severity', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: { code: 'invalid_severity', message: 'Bad severity' } }),
    })

    render(CommentComposer, { props: { taskId: 't1', severity: 'MAJOR' } })

    await fireEvent.input(screen.getByTestId('composer-body'), {
      target: { value: 'Body' },
    })
    await fireEvent.click(screen.getByTestId('composer-submit'))

    await vi.waitFor(() => {
      expect(screen.getByTestId('composer-error').textContent).toBe('Bad severity')
    })
  })

  it('shows inline error on invalid_parent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: { code: 'invalid_parent', message: 'Bad parent' } }),
    })

    render(CommentComposer, {
      props: { taskId: 't1', parentId: 'bad-parent', severity: 'MINOR' },
    })

    await fireEvent.input(screen.getByTestId('composer-body'), {
      target: { value: 'Body' },
    })
    await fireEvent.click(screen.getByTestId('composer-submit'))

    await vi.waitFor(() => {
      expect(screen.getByTestId('composer-error').textContent).toBe('Bad parent')
    })
  })
})
