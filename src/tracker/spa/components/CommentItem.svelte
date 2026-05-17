<script lang="ts">
  import type { CommentData } from '../lib/api.js'
  import CommentComposer from './CommentComposer.svelte'
  import { timeAgo } from './time'

  interface Props {
    comment: CommentData
    replies: CommentData[]
    taskId: string
    onReplySubmitted?: () => void
  }

  let { comment, replies, taskId, onReplySubmitted }: Props = $props()

  let showReply = $state(false)

  let severityColor = $derived(comment.severity === 'MAJOR' ? '#EF4444' : '#F59E0B')
</script>

<div class="comment-item" data-testid="comment-item" data-severity={comment.severity}>
  <div class="comment-header">
    <span
      class="severity-chip"
      style="background-color: {severityColor};"
      data-testid="comment-severity-chip"
    >
      {comment.severity}
    </span>
    {#if comment.line}
      <span class="line-ref" data-testid="line-ref">L{comment.line}</span>
    {/if}
  </div>
  <div class="comment-body" data-testid="comment-body">{comment.body}</div>
  <div class="comment-meta">
    <span class="author" data-testid="comment-author">{comment.author ?? 'Unknown'}</span>
    <span class="timestamp" data-testid="comment-timestamp">{comment.created_at ? timeAgo(comment.created_at) : ''}</span>
    <button class="reply-link" onclick={() => showReply = !showReply} data-testid="reply-link">
      {showReply ? 'Cancel' : 'Reply'}
    </button>
  </div>

  {#if showReply}
    <div class="reply-composer">
      <CommentComposer
        {taskId}
        parentId={comment.id}
        severity={comment.severity as 'MAJOR' | 'MINOR'}
        onSubmitted={() => { showReply = false; onReplySubmitted?.() }}
      />
    </div>
  {/if}

  {#if replies.length > 0}
    <div class="replies" data-testid="replies">
      {#each replies as reply (reply.id)}
        <div class="reply-item" data-testid="reply-item">
          <div class="comment-header">
            <span
              class="severity-chip"
              style="background-color: {reply.severity === 'MAJOR' ? '#EF4444' : '#F59E0B'};"
            >
              {reply.severity}
            </span>
            {#if reply.line}
              <span class="line-ref">L{reply.line}</span>
            {/if}
          </div>
          <div class="comment-body">{reply.body}</div>
          <div class="comment-meta">
            <span class="author">{reply.author ?? 'Unknown'}</span>
            <span class="timestamp">{reply.created_at ? timeAgo(reply.created_at) : ''}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .comment-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid #282624;
  }
  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .severity-chip {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    color: #111110;
    flex-shrink: 0;
  }
  .line-ref {
    font-size: 11px;
    color: #A39E96;
    font-family: 'JetBrains Mono', monospace;
  }
  .comment-body {
    font-size: 12px;
    line-height: 16px;
    color: #EDE9E3;
    white-space: pre-wrap;
  }
  .comment-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #6B6560;
  }
  .reply-link {
    background: none;
    border: none;
    padding: 0;
    color: #A78BFA;
    font-size: 11px;
    cursor: pointer;
    text-decoration: underline;
  }
  .reply-composer {
    margin-top: 8px;
  }
  .replies {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    padding-left: 16px;
    border-left: 2px solid #333130;
  }
  .reply-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 0;
  }
</style>
