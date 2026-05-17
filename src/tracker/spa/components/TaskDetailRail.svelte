<script lang="ts">
  import type { SelectionStore } from '../stores/selection.svelte'
  import type { TasksStore } from '../stores/tasks.svelte'
  import type { CommentsStore } from '../stores/comments.svelte'
  import CommentThread from './CommentThread.svelte'
  import { updateTask, type TaskData } from '../lib/api.js'

  interface Props {
    selection?: SelectionStore
    tasks?: TasksStore
    comments?: CommentsStore
  }

  let { selection, tasks, comments }: Props = $props()

  const STATUS_COLORS: Record<string, string> = {
    'TO-DO': '#6B6560',
    'IN-PROGRESS': '#F97316',
    'IN-REVIEW': '#A78BFA',
    'REWORK': '#EC4899',
    'DONE': '#22C55E',
  }

  const STATE_LABELS: Record<string, string> = {
    'TO-DO': 'To Do',
    'IN-PROGRESS': 'In Progress',
    'IN-REVIEW': 'In Review',
    'REWORK': 'Rework',
    'DONE': 'Done',
  }

  let open = $derived(selection.selectedId !== null)
  let task = $derived(tasks.tasks.find((t) => t.id === selection.selectedId) as TaskData | undefined)

  $effect(() => {
    const id = selection.selectedId
    if (id) {
      comments.loadForTask(id)
    }
  })

  function getStatusColor(t: TaskData | undefined): string {
    const state = (t?.state ?? t?.status ?? '').toUpperCase()
    return STATUS_COLORS[state] ?? '#6B6560'
  }

  function getStateLabel(t: TaskData | undefined): string {
    const state = (t?.state ?? t?.status ?? '').toUpperCase()
    return STATE_LABELS[state] ?? 'Unknown'
  }

  let editing = $state(false)
  let draft = $state('')

  function enterEdit() {
    draft = task?.description ?? ''
    editing = true
  }

  async function saveDescription() {
    if (!task?.id) return
    if (draft === (task.description ?? '')) {
      editing = false
      return
    }
    const result = await updateTask(task.id, { description: draft })
    if (result.ok) {
      editing = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveDescription()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      editing = false
      draft = task?.description ?? ''
    }
  }
</script>

{#if open && task}
  <div class="rail" data-testid="task-detail-rail">
    <div class="rail-header">
      <div class="rail-title-row">
        <div class="status-row">
          <span
            class="status-dot"
            style="background-color: {getStatusColor(task)};"
            data-testid="status-dot"
          ></span>
          <span class="state-label" data-testid="state-label">{getStateLabel(task)}</span>
        </div>
        <button
          class="close-btn"
          onclick={() => selection.clear()}
          aria-label="Close"
          data-testid="close-btn"
        >×</button>
      </div>
      <h2 class="task-title" data-testid="task-title">{task.title}</h2>
    </div>

    <div class="rail-section">
      {#if editing}
        <textarea
          class="desc-textarea"
          bind:value={draft}
          onkeydown={handleKeydown}
          onblur={() => saveDescription()}
          data-testid="desc-textarea"
        ></textarea>
      {:else}
        <div
          class="desc-text"
          role="button"
          tabindex="0"
          onclick={enterEdit}
          onkeydown={(e) => { if (e.key === 'Enter') enterEdit() }}
          data-testid="desc-text"
        >
          {task.description || 'No description'}
        </div>
      {/if}
    </div>

    <div class="rail-section">
      <CommentThread taskId={task.id} {comments} />
    </div>
  </div>
{/if}

<style>
  .rail {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background-color: #151413;
    border-left: 1px solid #333130;
    overflow-y: auto;
  }
  .rail-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rail-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .state-label {
    font-size: 12px;
    font-weight: 500;
    color: #A39E96;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .close-btn {
    background: none;
    border: none;
    color: #6B6560;
    font-size: 18px;
    line-height: 18px;
    cursor: pointer;
    padding: 0 4px;
  }
  .task-title {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    color: #EDE9E3;
    margin: 0;
  }
  .rail-section {
    display: flex;
    flex-direction: column;
  }
  .desc-text {
    font-size: 12px;
    line-height: 16px;
    color: #EDE9E3;
    white-space: pre-wrap;
    cursor: text;
    min-height: 40px;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 4px;
  }
  .desc-text:hover {
    border-color: #333130;
    background-color: #1a1918;
  }
  .desc-textarea {
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 8px;
    color: #EDE9E3;
    font-size: 12px;
    line-height: 16px;
    min-height: 80px;
    resize: vertical;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
</style>
