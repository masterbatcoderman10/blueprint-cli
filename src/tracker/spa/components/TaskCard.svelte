<script lang="ts">
  import type { TaskData } from '../lib/api.js'

  interface Props {
    task: TaskData
    onSelect?: (id: string) => void
  }

  let { task, onSelect }: Props = $props()

  const STREAM_PALETTE: Record<string, string> = {
    A: '#6B6560',
    B: '#3B82F6',
    C: '#F97316',
    D: '#A78BFA',
    E: '#EC4899',
    F: '#22C55E',
    G: '#EAB308',
    H: '#06B6D4',
    I: '#F43F5E',
    J: '#8B5CF6',
  }

  function streamColor(stream?: string): string {
    if (!stream) return '#6B6560'
    return STREAM_PALETTE[stream.toUpperCase()] ?? '#6B6560'
  }

  function handleClick() {
    if (task.id) {
      onSelect?.(task.id)
    }
  }
</script>

<div
  data-testid="task-card"
  role="button"
  tabindex="0"
  onclick={handleClick}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
  style="
    background-color: #1E1D1B;
    border: 1px solid #333130;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    cursor: pointer;
  "
>
  <div
    style="
      color: #EDE9E3;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 12px;
      line-height: 17px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    "
  >
    {task.title ?? 'Untitled'}
  </div>

  <div style="display: flex; align-items: center; gap: 6px;">
    {#if task.stream}
      <div
        data-testid="stream-chip"
        style="
          background-color: {streamColor(task.stream)};
          border-radius: 3px;
          padding: 2px 4px;
        "
      >
        <span
          style="
            color: #111110;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 8px;
            font-weight: 700;
            line-height: 10px;
            text-transform: uppercase;
          "
        >
          Stream {task.stream}
        </span>
      </div>
    {/if}

    {#if task.gate}
      <div
        data-testid="gate-chip"
        style="
          background-color: #22C55E;
          border-radius: 3px;
          padding: 2px 4px;
        "
      >
        <span
          style="
            color: #111110;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 8px;
            font-weight: 700;
            line-height: 10px;
            text-transform: uppercase;
          "
        >
          {task.gate}
        </span>
      </div>
    {/if}

    <span
      data-testid="task-id"
      style="
        color: #A39E96;
        font-family: 'JetBrains Mono', system-ui, sans-serif;
        font-size: 10px;
        line-height: 12px;
      "
    >
      {task.id ?? ''}
    </span>
  </div>
</div>
