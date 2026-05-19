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
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid #333130;
    border-radius: 6px;
    background-color: #1a1918;
    overflow: hidden;
  }
  .composer-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
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
  .line-input {
    box-sizing: border-box;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 8px 10px;
    color: #D7D3CD;
    font-size: 13px;
    line-height: 16px;
    font-family: 'JetBrains Mono', monospace;
  }
  .body-textarea {
    box-sizing: border-box;
    width: 100%;
    background: transparent;
    border: 1px solid #333130;
    border-radius: 4px;
    padding: 12px;
    color: #D7D3CD;
    font-size: 13px;
    line-height: 20px;
    min-height: 120px;
    resize: vertical;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .submit-btn {
    align-self: flex-start;
    min-width: 96px;
    height: 40px;
    padding: 0 16px;
    border: 1px solid #333130;
    border-radius: 6px;
    background-color: #282624;
    color: #EDE9E3;
    font-size: 12px;
    line-height: 16px;
    cursor: pointer;
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .line-input::placeholder,
  .body-textarea::placeholder {
    color: #6B6560;
  }
  .line-input:focus-visible,
  .body-textarea:focus-visible,
  .submit-btn:focus-visible {
    outline: 2px solid rgba(237, 233, 227, 0.85);
    outline-offset: 2px;
  }
  .error {
    color: #EF4444;
    font-size: 11px;
  }
</style>
