<script lang="ts">
  import type { TaskData } from '../lib/api.js'
  import TaskCard from './TaskCard.svelte'

  interface Props {
    column: { id: string; label: string; dot: string }
    tasks: TaskData[]
    onSelect?: (id: string) => void
  }

  let { column, tasks, onSelect }: Props = $props()

  const EMPTY_COPY: Record<string, string> = {
    todo: 'No tasks waiting',
    'in-progress': 'Nothing in progress',
    'in-review': 'Nothing under review',
    rework: 'Review rejections land here',
    done: 'No completed tasks yet',
  }

  let doneExpanded = $state(false)

  const isDone = $derived(column.id === 'done')
  const visibleTasks = $derived(
    isDone && !doneExpanded && tasks.length > 2 ? tasks.slice(0, 2) : tasks
  )
  const hiddenCount = $derived(tasks.length - 2)
</script>

<div
  data-column={column.id}
  data-testid="column-{column.id}"
  style="
    flex: 1 1 0%;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  "
>
  <!-- Column header -->
  <div
    style="
      flex-shrink: 0;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    "
  >
    <div style="display: flex; align-items: center; gap: 8px;">
      <span
        style="
          flex-shrink: 0;
          width: 8px; height: 8px;
          border-radius: 50%;
          background-color: {column.dot};
          display: inline-block;
        "
      ></span>
      <span
        data-testid="column-title"
        style="
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 13px; font-weight: 600; line-height: 16px;
          color: #EDE9E3;
        "
      >
        {column.label}
      </span>
    </div>
    <div
      style="
        background-color: #282624;
        border-radius: 4px;
        padding: 2px 8px;
      "
    >
      <span
        data-testid="column-count"
        style="font-size: 14px; line-height: 18px; color: #A39E96;"
      >
        {tasks.length}
      </span>
    </div>
  </div>

  <!-- Task card area -->
  <div
    class="column-body"
    style="
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    "
  >
    {#if tasks.length === 0}
      <div
        data-testid="empty-state"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          color: #6B6560;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12px;
          line-height: 16px;
          text-align: center;
        "
      >
        {EMPTY_COPY[column.id] ?? 'No tasks'}
      </div>
    {:else}
      {#each visibleTasks as task (task.id)}
        <TaskCard {task} onSelect={onSelect} />
      {/each}

      {#if isDone && !doneExpanded && hiddenCount > 0}
        <button
          data-testid="done-toggle"
          onclick={() => (doneExpanded = true)}
          style="
            background: transparent;
            border: none;
            color: #A39E96;
            font-family: 'DM Sans', system-ui, sans-serif;
            font-size: 12px;
            line-height: 16px;
            cursor: pointer;
            text-align: center;
            padding: 6px 0;
          "
        >
          + {hiddenCount} more completed
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .column-body::-webkit-scrollbar {
    display: none;
  }
</style>
