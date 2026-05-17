/**
 * src/tracker/spa/stores/selection.svelte.ts
 * Svelte 5 rune-based selected-task store.
 *
 * Syncs selectedId ↔ URL hash: `#task=<id>`.
 * Reads initial value from window.location.hash on creation.
 * Writes hash on select/clear.
 * Listens for hashchange events to handle back/forward navigation.
 */

export interface SelectionStore {
  /** Currently selected task ID, or null if none */
  readonly selectedId: string | null
  /** Select a task — updates URL hash */
  select(id: string): void
  /** Clear selection — clears URL hash */
  clear(): void
}

function readHashTaskId(): string | null {
  try {
    const hash =
      (typeof window !== 'undefined' ? window.location.hash : null) ??
      (typeof location !== 'undefined' ? location.hash : null) ??
      ''
    const match = hash.match(/^#task=(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function writeHash(id: string | null): void {
  try {
    const loc =
      (typeof window !== 'undefined' ? window.location : null) ??
      (typeof location !== 'undefined' ? location : null)
    if (!loc) return
    // Cast to writable for test environment
    ;(loc as { hash: string }).hash = id ? `#task=${id}` : ''
  } catch {
    // noop in environments without location
  }
}

export function createSelectionStore(): SelectionStore {
  let selectedId = $state<string | null>(readHashTaskId())

  // Listen for browser back/forward navigation changing the hash
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      selectedId = readHashTaskId()
    })
  }

  return {
    get selectedId() { return selectedId },

    select(id: string) {
      selectedId = id
      writeHash(id)
    },

    clear() {
      selectedId = null
      writeHash(null)
    },
  }
}
