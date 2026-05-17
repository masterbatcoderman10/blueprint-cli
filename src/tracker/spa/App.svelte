<script lang="ts">
  /**
   * App.svelte — Root layout for the Blueprint Board SPA.
   * Design contract: 2YY-0 artboard (src/design/2YY-0.jsx).
   *
   * Layout: [Board panel (flex-1)] [TaskDetailRail (280px, collapsible)]
   * The rail is closed by default (data-open="false").
   * Column order matches P1 kanban statuses: To Do | In Progress | In Review | Rework | Done
   */

  import Board from './components/Board.svelte'
  import TaskDetailRail from './components/TaskDetailRail.svelte'
  import { selectionStore } from './stores/index.js'

  let railOpen = $derived(selectionStore.selectedId !== null)

  $effect(() => {
    if (!railOpen) return
    const handler = (e: MouseEvent) => {
      const rail = document.querySelector('[data-rail]')
      if (rail && !rail.contains(e.target as Node)) {
        selectionStore.clear()
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
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
  <Board />

  <!-- Task Detail Rail -->
  <div
    data-rail
    data-open={String(railOpen)}
    style="
      flex-shrink: 0;
      width: {railOpen ? '280px' : '0'};
      overflow: hidden;
      transition: width 200ms ease;
      background-color: #151413;
      border-left: {railOpen ? '1px solid #333130' : 'none'};
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: {railOpen ? '20px' : '0'};
    "
  >
    <TaskDetailRail />
  </div>
</div>
