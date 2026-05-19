<script lang="ts">
  import type { CommentsStore } from '../stores/comments.svelte'
  import type { CommentData } from '../lib/api.js'
  import CommentItem from './CommentItem.svelte'
  import CommentComposer from './CommentComposer.svelte'

  interface Props {
    taskId: string
    comments?: CommentsStore
  }

  let { taskId, comments }: Props = $props()

  let showComposer = $state(false)
  let composerSeverity = $state<'MAJOR' | 'MINOR'>('MAJOR')

  const allComments = $derived(comments.comments)

  const topLevel = $derived(
    allComments.filter((c) => !c.parent_id)
  )

  const repliesByParent = $derived.by(() => {
    const map = new Map<string, CommentData[]>()
    for (const c of allComments) {
      if (c.parent_id) {
        const list = map.get(c.parent_id) ?? []
        list.push(c)
        map.set(c.parent_id, list)
      }
    }
    return map
  })

  const orderedTopLevel = $derived.by(() => {
    const majors = topLevel.filter((c) => c.severity === 'MAJOR')
    const minors = topLevel.filter((c) => c.severity === 'MINOR')
    const sortAsc = (a: CommentData, b: CommentData) =>
      (a.created_at ?? 0) - (b.created_at ?? 0)
    return [...majors.sort(sortAsc), ...minors.sort(sortAsc)]
  })

  function openComposer(sev: 'MAJOR' | 'MINOR') {
    composerSeverity = sev
    showComposer = true
  }

  function handleSubmitted() {
    showComposer = false
    comments.loadForTask(taskId)
  }
</script>

<div class="comment-thread" data-testid="comment-thread">
  <div class="thread-header">
    <span class="thread-label">Review Comments</span>
    <div class="thread-actions">
      <button class="action-btn action-btn-major" onclick={() => openComposer('MAJOR')} data-testid="add-major">+ MAJOR</button>
      <button class="action-btn action-btn-minor" onclick={() => openComposer('MINOR')} data-testid="add-minor">+ MINOR</button>
    </div>
  </div>

  {#if showComposer}
    <div class="top-composer" data-testid="top-composer">
      <CommentComposer
        {taskId}
        severity={composerSeverity}
        onSubmitted={handleSubmitted}
      />
    </div>
  {/if}

  <div class="comments-list" data-testid="comments-list">
    {#each orderedTopLevel as comment (comment.id)}
      <CommentItem
        {comment}
        {taskId}
        replies={repliesByParent.get(comment.id ?? '') ?? []}
        onReplySubmitted={() => comments.loadForTask(taskId)}
      />
    {:else}
      <div class="empty" data-testid="empty-comments">No comments yet.</div>
    {/each}
  </div>
</div>

<style>
  .comment-thread {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
  }
  .thread-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .thread-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #A8A29E;
  }
  .thread-actions {
    display: flex;
    gap: 6px;
  }
  .action-btn {
    height: 24px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    background-color: transparent;
    font-size: 10px;
    font-weight: 600;
    line-height: 12px;
    cursor: pointer;
  }
  .action-btn-major {
    background-color: rgba(220, 38, 38, 0.15);
    border-color: rgba(220, 38, 38, 0.3);
    color: #EF4444;
  }
  .action-btn-minor {
    background-color: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.3);
    color: #F59E0B;
  }
  .top-composer {
    margin-bottom: 8px;
  }
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .empty {
    font-size: 12px;
    line-height: 16px;
    color: #6B6560;
    padding: 4px 0 0;
  }
</style>
