// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { createMockTasksStore, createMockSelectionStore } from './helpers.svelte'

describe('helpers', () => {
  it('mock selection store reactivity works', async () => {
    const sel = createMockSelectionStore(null)
    expect(sel.selectedId).toBe(null)
    sel.select('task-1')
    expect(sel.selectedId).toBe('task-1')
  })
})
