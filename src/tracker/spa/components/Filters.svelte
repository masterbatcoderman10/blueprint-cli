<script lang="ts">
  import type { TaskData } from '../lib/api.js'
  import Dropdown from './Dropdown.svelte'

  interface Props {
    tasks?: TaskData[]
    allTasks?: TaskData[]
    onFilterChange?: (filter: { milestone?: string; phase?: string; stream?: string }) => void
  }

  let { tasks = [], allTasks = [], onFilterChange }: Props = $props()

  let selectedMilestone = $state('')
  let selectedPhase = $state('')
  let selectedStream = $state('')

  // Derive options from allTasks (unfiltered) so options never shrink when a filter is active
  const sourceTasks = $derived(allTasks.length > 0 ? allTasks : tasks)

  const milestones = $derived(
    Array.from(new Set(sourceTasks.map((t) => t.milestone).filter(Boolean) as string[])).sort()
  )
  const phases = $derived(
    Array.from(new Set(sourceTasks.map((t) => t.phase).filter(Boolean) as string[])).sort()
  )
  const streams = $derived(
    Array.from(new Set(sourceTasks.map((t) => t.stream).filter(Boolean) as string[])).sort()
  )

  function handleMilestoneChange(value: string) {
    selectedMilestone = value
    onFilterChange?.({
      milestone: value || undefined,
      phase: selectedPhase || undefined,
      stream: selectedStream || undefined,
    })
  }

  function handlePhaseChange(value: string) {
    selectedPhase = value
    onFilterChange?.({
      milestone: selectedMilestone || undefined,
      phase: value || undefined,
      stream: selectedStream || undefined,
    })
  }

  function handleStreamChange(value: string) {
    selectedStream = value
    onFilterChange?.({
      milestone: selectedMilestone || undefined,
      phase: selectedPhase || undefined,
      stream: value || undefined,
    })
  }
</script>

<div style="display: flex; gap: 12px;">
  <Dropdown
    label="Milestone"
    value={selectedMilestone}
    options={milestones}
    placeholder="All Milestones"
    onChange={handleMilestoneChange}
  />
  <Dropdown
    label="Phase"
    value={selectedPhase}
    options={phases}
    placeholder="All Phases"
    onChange={handlePhaseChange}
  />
  <Dropdown
    label="Stream"
    value={selectedStream}
    options={streams}
    placeholder="All Streams"
    onChange={handleStreamChange}
  />
</div>
