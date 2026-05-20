<script lang="ts">
  import TaskDetailRail from '../../../src/tracker/spa/components/TaskDetailRail.svelte'
  import type { MockSelectionStore, MockTasksStore, MockCommentsStore } from './helpers.svelte'

  interface Props {
    selection: MockSelectionStore
    tasks: MockTasksStore
    comments: MockCommentsStore
  }

  let { selection, tasks, comments }: Props = $props()

  function handleClick(e: MouseEvent) {
    const rail = (e.currentTarget as HTMLElement).querySelector('[data-testid="task-detail-rail"]')
    if (rail && !rail.contains(e.target as Node)) {
      // Guard: task-card clicks switch selection; do not treat them as rail-close
      const targetEl = e.target instanceof Element ? e.target : (e.target as Node).parentElement
      if (targetEl?.closest?.('[data-testid="task-card"]')) return
      selection.clear()
    }
  }
</script>

<div data-testid="app-wrapper" onclick={handleClick}>
  <div data-testid="board-panel">
    Board Panel
    <div data-testid="task-card" role="button" tabindex="0" onclick={() => selection.select('task-2')} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selection.select('task-2') }}>Task Card</div>
  </div>
  <TaskDetailRail {selection} {tasks} {comments} />
</div>
