/**
 * src/tracker/spa/stores/index.ts
 * Singleton store instances for the SPA.
 */

import { createSelectionStore } from './selection.svelte'
import { createTasksStore } from './tasks.svelte'
import { createCommentsStore } from './comments.svelte'

export const selectionStore = createSelectionStore()
export const tasksStore = createTasksStore()
export const commentsStore = createCommentsStore()
