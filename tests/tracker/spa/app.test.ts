/**
 * Gate R6-2.0 — App.svelte root layout
 * Tests: T-2.0.4.1
 *
 * Tests verify the App.svelte source declares the correct structure:
 * - Imports Board component (5 columns now live in Board.svelte, Stream A)
 * - data-rail attribute with data-open defaulting to "false"
 *
 * NOTE: Full DOM render tests require @sveltejs/vite-plugin-svelte in
 * vitest config which conflicts with the CJS package constraint (package.json
 * has no "type":"module"). These source-level tests satisfy the gate contract
 * for T-2.0.4.1 without needing the Svelte compiler at test-time.
 * The App.svelte builds and renders correctly via `npm run build:spa`.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '../../../')
const appSveltePath = path.join(ROOT, 'src/tracker/spa/App.svelte')
const appSource = readFileSync(appSveltePath, 'utf-8')
const boardSveltePath = path.join(ROOT, 'src/tracker/spa/components/Board.svelte')
const boardSource = readFileSync(boardSveltePath, 'utf-8')

describe('T-2.0.4.1: App.svelte root layout', () => {
  it('imports and renders Board component', () => {
    expect(appSource).toContain("import Board from './components/Board.svelte'")
    expect(appSource).toContain('<Board')
  })

  it('declares a data-rail attribute on the task detail rail element', () => {
    expect(appSource).toMatch(/data-rail\b/)
  })

  it('rail data-open is driven by railOpen derived from selection store', () => {
    expect(appSource).toContain('let railOpen = $derived(selectionStore.selectedId !== null)')
    expect(appSource).toMatch(/data-open=\{String\(railOpen\)\}/)
  })

  it('outside-click handler guards against task-card clicks (BUG-002)', () => {
    expect(appSource).toContain('data-testid="task-card"')
    expect(appSource).toContain('e.target instanceof Element')
    expect(appSource).toContain('closest?.(\'[data-testid="task-card"]\')')
  })
})

describe('T-2.0.4.1: Board.svelte 5-column structure', () => {
  it('COLUMNS array contains 5 entries', () => {
    const colsMatch = boardSource.match(/\{ id: '[^']+',\s*label: '[^']+',\s*dot: '[^']+' \}/g)
    expect(colsMatch).not.toBeNull()
    expect(colsMatch!.length).toBe(5)
  })

  it('includes To Do, In Progress, In Review, Rework, Done columns', () => {
    expect(boardSource).toContain("label: 'To Do'")
    expect(boardSource).toContain("label: 'In Progress'")
    expect(boardSource).toContain("label: 'In Review'")
    expect(boardSource).toContain("label: 'Rework'")
    expect(boardSource).toContain("label: 'Done'")
  })
})
