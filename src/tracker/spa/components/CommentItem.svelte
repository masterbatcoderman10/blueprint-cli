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
    <span class="severity-chip" data-testid="comment-severity-chip" data-severity={comment.severity}>
      {comment.severity}
    </span>
    {#if comment.line}
      <span class="line-ref" data-testid="line-ref">Line {comment.line}</span>
    {/if}
  </div>
  <div class="comment-body" data-testid="comment-body">{comment.body}</div>
  <div class="comment-meta">
    <div class="comment-meta-row">
      <span class="author" data-testid="comment-author">{comment.author ?? 'Unknown'}</span>
      <span class="timestamp" data-testid="comment-timestamp">{comment.created_at ? timeAgo(comment.created_at) : ''}</span>
    </div>
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
          <div class="comment-header reply-header">
            <span class="severity-chip" data-severity={reply.severity}>
              {reply.severity}
            </span>
            {#if reply.line}
              <span class="line-ref">Line {reply.line}</span>
            {/if}
          </div>
          <div class="comment-body">{reply.body}</div>
          <div class="comment-meta-row">
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
    gap: 12px;
    padding: 14px;
    border: 1px solid #333130;
    border-radius: 6px;
    background-color: #1E1D1B;
  }
  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .severity-chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    line-height: 12px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid transparent;
    flex-shrink: 0;
  }
  .severity-chip[data-severity='MAJOR'] {
    background-color: rgba(220, 38, 38, 0.15);
    border-color: rgba(220, 38, 38, 0.3);
    color: #EF4444;
  }
  .severity-chip[data-severity='MINOR'] {
    background-color: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.3);
    color: #F59E0B;
  }
  .line-ref {
    font-size: 12px;
    line-height: 16px;
    color: #A8A29E;
  }
  .comment-body {
    font-size: 12px;
    line-height: 18px;
    color: #D7D3CD;
    white-space: pre-wrap;
  }
  .comment-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .comment-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .author {
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    color: #EDE9E3;
  }
  .timestamp {
    font-size: 9px;
    line-height: 12px;
    color: #A8A29E;
  }
  .reply-link {
    background: none;
    border: none;
    padding: 0;
    color: #A8A29E;
    font-size: 10px;
    line-height: 12px;
    cursor: pointer;
  }
  .reply-composer {
    margin-top: 8px;
  }
  .replies {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 4px;
    padding-left: 20px;
    border-left: 1px solid #333130;
  }
  .reply-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
