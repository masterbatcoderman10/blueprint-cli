<script lang="ts">
  /**
   * App.svelte — Root layout for the Blueprint Board SPA.
   * Design contract: 2YY-0 artboard (src/design/2YY-0.jsx).
   *
   * Layout: [Board panel (flex-1)] [TaskDetailRail (308px, collapsible)]
   * The rail is closed by default (data-open="false").
   * Column order matches P1 kanban statuses: To Do | In Progress | In Review | Rework | Done
   */

  import Board from './components/Board.svelte'
  import TaskDetailRail from './components/TaskDetailRail.svelte'
  import { selectionStore, tasksStore, commentsStore } from './stores/index.js'

  let railOpen = $derived(selectionStore.selectedId !== null)

  $effect(() => {
    if (!railOpen) return
    const handler = (e: MouseEvent) => {
      const rail = document.querySelector('[data-rail]')
      if (rail && !rail.contains(e.target as Node)) {
        selectionStore.clear()
      }
    }
    // Defer by one tick so the card click that opened the rail
    // finishes bubbling before this outside-click guard activates.
    const timeoutId = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handler)
    }
  })
</script>

<!--
  Root app shell.
  Board panel fills remaining width; rail slides in from the right.
  Tokens from src/design/computed-styles.json.
-->
<div
  class="app-root"
  style="
    display: flex;
    height: 100vh;
    overflow: hidden;
    background-color: #111110;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px;
    line-height: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #EDE9E3;
  "
>
  <!-- Board panel -->
  <Board {tasksStore} {selectionStore} />

  <!-- Task Detail Rail -->
  <div
    data-rail
    data-open={String(railOpen)}
    style="
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      width: {railOpen ? '308px' : '0'};
      overflow: hidden;
      transition: width 200ms ease;
    "
  >
    <TaskDetailRail selection={selectionStore} tasks={tasksStore} comments={commentsStore} />
  </div>
</div>
