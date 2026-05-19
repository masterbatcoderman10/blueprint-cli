<script lang="ts">
  import type { TaskData } from '../lib/api.js'

  interface Props {
    tasks?: TaskData[]
    onFilterChange?: (filter: { milestone?: string; phase?: string; stream?: string }) => void
  }

  let { tasks = [], onFilterChange }: Props = $props()

  let selectedMilestone = $state('')
  let selectedPhase = $state('')
  let selectedStream = $state('')

  const milestones = $derived(
    Array.from(new Set(tasks.map((t) => t.milestone).filter(Boolean) as string[])).sort()
  )
  const phases = $derived(
    Array.from(new Set(tasks.map((t) => t.phase).filter(Boolean) as string[])).sort()
  )
  const streams = $derived(
    Array.from(new Set(tasks.map((t) => t.stream).filter(Boolean) as string[])).sort()
  )

  function handleMilestoneChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value
    selectedMilestone = value
    onFilterChange?.({
      milestone: value || undefined,
      phase: selectedPhase || undefined,
      stream: selectedStream || undefined,
    })
  }

  function handlePhaseChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value
    selectedPhase = value
    onFilterChange?.({
      milestone: selectedMilestone || undefined,
      phase: value || undefined,
      stream: selectedStream || undefined,
    })
  }

  function handleStreamChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value
    selectedStream = value
    onFilterChange?.({
      milestone: selectedMilestone || undefined,
      phase: selectedPhase || undefined,
      stream: value || undefined,
    })
  }
</script>

<div style="display: flex; gap: 12px;">
  <div
    style="
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border: 1px solid #333130; border-radius: 6px;
      background-color: transparent;
    "
  >
    <label for="milestone-filter" style="font-size: 11px; line-height: 14px; color: #6B6560;">Milestone</label>
    <select
      id="milestone-filter"
      aria-label="Milestone"
      onchange={handleMilestoneChange}
      style="
        font-size: 13px; font-weight: 500; line-height: 16px;
        color: #EDE9E3;
        background: transparent;
        border: none;
        outline: none;
        appearance: none;
        cursor: pointer;
        font-family: 'DM Sans', system-ui, sans-serif;
      "
    >
      <option value="">All Milestones</option>
      {#each milestones as milestone}
        <option value={milestone}>{milestone}</option>
      {/each}
    </select>
    <span style="font-size: 10px; line-height: 12px; color: #6B6560;">▾</span>
  </div>

  <div
    style="
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border: 1px solid #333130; border-radius: 6px;
      background-color: transparent;
    "
  >
    <label for="phase-filter" style="font-size: 11px; line-height: 14px; color: #6B6560;">Phase</label>
    <select
      id="phase-filter"
      aria-label="Phase"
      onchange={handlePhaseChange}
      style="
        font-size: 13px; font-weight: 500; line-height: 16px;
        color: #EDE9E3;
        background: transparent;
        border: none;
        outline: none;
        appearance: none;
        cursor: pointer;
        font-family: 'DM Sans', system-ui, sans-serif;
      "
    >
      <option value="">All Phases</option>
      {#each phases as phase}
        <option value={phase}>{phase}</option>
      {/each}
    </select>
    <span style="font-size: 10px; line-height: 12px; color: #6B6560;">▾</span>
  </div>

  <div
    style="
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border: 1px solid #333130; border-radius: 6px;
      background-color: transparent;
    "
  >
    <label for="stream-filter" style="font-size: 11px; line-height: 14px; color: #6B6560;">Stream</label>
    <select
      id="stream-filter"
      aria-label="Stream"
      onchange={handleStreamChange}
      style="
        font-size: 13px; font-weight: 500; line-height: 16px;
        color: #EDE9E3;
        background: transparent;
        border: none;
        outline: none;
        appearance: none;
        cursor: pointer;
        font-family: 'DM Sans', system-ui, sans-serif;
      "
    >
      <option value="">All Streams</option>
      {#each streams as stream}
        <option value={stream}>{stream}</option>
      {/each}
    </select>
    <span style="font-size: 10px; line-height: 12px; color: #6B6560;">▾</span>
  </div>
</div>
