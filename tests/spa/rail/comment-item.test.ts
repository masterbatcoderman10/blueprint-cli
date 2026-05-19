// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import CommentItem from '../../../src/tracker/spa/components/CommentItem.svelte'

afterEach(() => {
  cleanup()
})

describe('R6-2.B.3: CommentItem', () => {
  const baseComment = {
    id: 'c1',
    task_id: 't1',
    parent_id: null,
    severity: 'MAJOR',
    body: 'Major issue here',
    author: 'Alice',
    line: '42',
    created_at: Date.now() - 3600000,
  }

  it('renders severity chip MAJOR in red', () => {
    render(CommentItem, {
      props: { comment: baseComment, replies: [], taskId: 't1' },
    })
    const chip = screen.getByTestId('comment-severity-chip')
    expect(chip.textContent).toBe('MAJOR')
    expect(chip.getAttribute('data-severity')).toBe('MAJOR')
  })

  it('renders severity chip MINOR in amber', () => {
    render(CommentItem, {
      props: { comment: { ...baseComment, severity: 'MINOR' }, replies: [], taskId: 't1' },
    })
    const chip = screen.getByTestId('comment-severity-chip')
    expect(chip.textContent).toBe('MINOR')
    expect(chip.getAttribute('data-severity')).toBe('MINOR')
  })

  it('renders optional line reference', () => {
    render(CommentItem, {
      props: { comment: baseComment, replies: [], taskId: 't1' },
    })
    expect(screen.getByTestId('line-ref').textContent).toBe('Line 42')
  })

  it('renders body, author and timestamp', () => {
    render(CommentItem, {
      props: { comment: baseComment, replies: [], taskId: 't1' },
    })
    expect(screen.getByTestId('comment-body').textContent).toBe('Major issue here')
    expect(screen.getByTestId('comment-author').textContent).toBe('Alice')
    expect(screen.getByTestId('comment-timestamp').textContent).toContain('ago')
  })

  it('shows Reply link and toggles composer', async () => {
    render(CommentItem, {
      props: { comment: baseComment, replies: [], taskId: 't1' },
    })
    const replyLink = screen.getByTestId('reply-link')
    expect(replyLink.textContent).toBe('Reply')

    await fireEvent.click(replyLink)
    expect(screen.getByTestId('comment-composer')).toBeTruthy()
    expect(screen.getByTestId('reply-link').textContent).toBe('Cancel')

    await fireEvent.click(screen.getByTestId('reply-link'))
    expect(screen.queryByTestId('comment-composer')).toBeNull()
  })

  it('renders replies under parent', () => {
    const reply = {
      id: 'c2',
      task_id: 't1',
      parent_id: 'c1',
      severity: 'MINOR',
      body: 'Reply body',
      author: 'Bob',
      line: null,
      created_at: Date.now() - 1800000,
    }
    render(CommentItem, {
      props: { comment: baseComment, replies: [reply], taskId: 't1' },
    })
    const repliesContainer = screen.getByTestId('replies')
    expect(repliesContainer).toBeTruthy()
    expect(screen.getAllByTestId('reply-item').length).toBe(1)
  })
})
