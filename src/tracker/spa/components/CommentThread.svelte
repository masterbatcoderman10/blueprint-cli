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
      <button class="action-btn" onclick={() => openComposer('MAJOR')} data-testid="add-major">+ MAJOR</button>
      <button class="action-btn" onclick={() => openComposer('MINOR')} data-testid="add-minor">+ MINOR</button>
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
    gap: 12px;
  }
  .thread-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .thread-label {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #EDE9E3;
  }
  .thread-actions {
    display: flex;
    gap: 6px;
  }
  .action-btn {
    padding: 4px 10px;
    border: 1px solid #333130;
    border-radius: 4px;
    background-color: #282624;
    color: #EDE9E3;
    font-size: 11px;
    cursor: pointer;
  }
  .top-composer {
    margin-bottom: 8px;
  }
  .comments-list {
    display: flex;
    flex-direction: column;
  }
  .empty {
    font-size: 12px;
    color: #6B6560;
    padding: 12px 0;
  }
</style>
