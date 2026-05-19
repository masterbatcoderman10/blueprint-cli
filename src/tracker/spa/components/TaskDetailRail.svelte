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
  let descriptionExpanded = $state(false)
  const DESCRIPTION_PREVIEW_LENGTH = 420

  let description = $derived(task?.description ?? '')
  let showsDescriptionToggle = $derived(description.length > DESCRIPTION_PREVIEW_LENGTH)

  $effect(() => {
    selection.selectedId
    editing = false
    descriptionExpanded = false
  })

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

    <div class="rail-divider" data-testid="rail-divider"></div>

    <div class="rail-section rail-section-description">
      <div class="rail-section-label">Description</div>
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
          class:desc-clamped={showsDescriptionToggle && !descriptionExpanded}
          class="desc-text"
          role="button"
          tabindex="0"
          onclick={enterEdit}
          onkeydown={(e) => { if (e.key === 'Enter') enterEdit() }}
          data-testid="desc-text"
        >
          {description || 'No description'}
        </div>
        {#if showsDescriptionToggle}
          <button
            class="desc-toggle"
            type="button"
            onclick={() => descriptionExpanded = !descriptionExpanded}
            data-testid="desc-toggle"
          >
            {descriptionExpanded ? 'View less' : 'View more'}
          </button>
        {/if}
      {/if}
    </div>

    <div class="rail-divider" data-testid="rail-divider"></div>

    <div class="rail-section rail-section-comments">
      <CommentThread taskId={task.id} {comments} />
    </div>
  </div>
{/if}

<style>
  .rail {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
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
    gap: 10px;
  }
  .rail-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .state-label {
    font-size: 11px;
    line-height: 14px;
    color: #A8A29E;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #6B6560;
    width: 24px;
    height: 24px;
    font-size: 22px;
    line-height: 22px;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }
  .task-title {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: #EDE9E3;
    margin: 0;
  }
  .rail-divider {
    width: 100%;
    height: 1px;
    flex-shrink: 0;
    background-color: #333130;
  }
  .rail-section {
    display: flex;
    flex-direction: column;
  }
  .rail-section-description {
    gap: 12px;
    flex-shrink: 0;
  }
  .rail-section-comments {
    gap: 16px;
    flex: 1 1 auto;
    min-height: 0;
  }
  .rail-section-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #A8A29E;
  }
  .desc-text {
    display: -webkit-box;
    font-size: 13px;
    line-height: 20px;
    color: #D7D3CD;
    white-space: pre-wrap;
    cursor: text;
    min-height: 40px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    -webkit-box-orient: vertical;
  }
  .desc-clamped {
    -webkit-line-clamp: 12;
  }
  .desc-text:hover {
    border-color: #282624;
    background-color: rgba(40, 38, 36, 0.2);
  }
  .desc-toggle {
    align-self: flex-start;
    padding: 0;
    background: none;
    border: none;
    color: #A8A29E;
    font-size: 11px;
    line-height: 14px;
    cursor: pointer;
  }
  .desc-textarea {
    box-sizing: border-box;
    width: 100%;
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 8px;
    color: #D7D3CD;
    font-size: 13px;
    line-height: 20px;
    min-height: 80px;
    resize: vertical;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .close-btn:focus-visible,
  .desc-toggle:focus-visible,
  .desc-textarea:focus-visible,
  .desc-text:focus-visible {
    outline: 2px solid rgba(237, 233, 227, 0.85);
    outline-offset: 2px;
  }
</style>
