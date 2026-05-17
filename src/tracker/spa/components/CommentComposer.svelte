<script lang="ts">
  import { createComment, type CommentData } from '../lib/api.js'

  interface Props {
    taskId: string
    parentId?: string
    severity: 'MAJOR' | 'MINOR'
    onSubmitted?: () => void
  }

  let { taskId, parentId, severity, onSubmitted }: Props = $props()

  let line = $state('')
  let body = $state('')
  let error = $state<string | null>(null)
  let submitting = $state(false)

  async function submit(e: Event) {
    e.preventDefault()
    if (!body.trim()) return
    submitting = true
    error = null

    const result = await createComment(taskId, {
      parent_id: parentId ?? null,
      severity,
      line: line.trim() || null,
      body: body.trim(),
    } as CommentData)

    submitting = false

    if (!result.ok) {
      const code = result.error.code
      if (code === 'invalid_parent' || code === 'invalid_severity') {
        error = result.error.message
      } else {
        error = result.error.message
      }
      return
    }

    line = ''
    body = ''
    onSubmitted?.()
  }
</script>

<form class="composer" onsubmit={submit} data-testid="comment-composer">
  <div class="composer-header">
    <span
      class="severity-chip"
      data-severity={severity}
      style="background-color: {severity === 'MAJOR' ? '#EF4444' : '#F59E0B'};"
    >
      {severity}
    </span>
    <input
      class="line-input"
      type="text"
      placeholder="Line (optional)"
      bind:value={line}
      data-testid="composer-line"
    />
  </div>
  <textarea
    class="body-textarea"
    placeholder="Write a comment…"
    bind:value={body}
    data-testid="composer-body"
  ></textarea>
  {#if error}
    <div class="error" data-testid="composer-error">{error}</div>
  {/if}
  <button
    class="submit-btn"
    type="submit"
    disabled={!body.trim() || submitting}
    data-testid="composer-submit"
  >
    {submitting ? '…' : 'Submit'}
  </button>
</form>

<style>
  .composer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid #333130;
    border-radius: 6px;
    background-color: #1a1918;
  }
  .composer-header {
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
  .line-input {
    flex: 1 1 auto;
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 4px 8px;
    color: #EDE9E3;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  .body-textarea {
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 8px;
    color: #EDE9E3;
    font-size: 12px;
    line-height: 16px;
    min-height: 60px;
    resize: vertical;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .submit-btn {
    align-self: flex-start;
    padding: 6px 14px;
    border: 1px solid #333130;
    border-radius: 6px;
    background-color: #282624;
    color: #EDE9E3;
    font-size: 12px;
    cursor: pointer;
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .error {
    color: #EF4444;
    font-size: 11px;
  }
</style>
