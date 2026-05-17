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
      selection.clear()
    }
  }
</script>

<div data-testid="app-wrapper" onclick={handleClick}>
  <div data-testid="board-panel">Board Panel</div>
  <TaskDetailRail {selection} {tasks} {comments} />
</div>
