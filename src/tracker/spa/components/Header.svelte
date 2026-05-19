<script lang="ts">
  import { onMount } from 'svelte'
  import { getProject, type TaskData, type ProjectData } from '../lib/api.js'

  interface Props {
    projectName?: string
    projectTagline?: string
    tasks?: TaskData[]
  }

  let { projectName, projectTagline, tasks = [] }: Props = $props()

  let fetchedProject = $state<ProjectData | null>(null)
  let loading = $state(true)
  let error = $state(false)

  const project = $derived(
    projectName !== undefined
      ? { name: projectName, description: projectTagline }
      : fetchedProject
  )

  onMount(() => {
    if (projectName !== undefined) {
      loading = false
      return
    }
    void getProject().then((result) => {
      loading = false
      if (result.ok) {
        fetchedProject = result.data
        error = false
      } else {
        error = true
      }
    })
  })

  const name = $derived(project?.name ?? '—')
  const tagline = $derived(project?.description ?? '—')

  const phaseCount = $derived(new Set(tasks.map((t) => t.phase).filter(Boolean)).size)
  const streamCount = $derived(new Set(tasks.map((t) => t.stream).filter(Boolean)).size)
  const milestoneCount = $derived(
    new Set(tasks.map((t) => t.milestone).filter(Boolean)).size
  )
</script>

<div
  style="
    flex-shrink: 0;
    height: 143px;
    padding: 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border-bottom: 1px solid #333130;
  "
>
  <!-- Project name + view toggle row -->
  <div style="display: flex; align-items: flex-start; justify-content: space-between;">
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <span
        data-testid="project-name"
        style="
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 30px;
          color: #EDE9E3;
        "
      >
        {name}
      </span>
      <span
        data-testid="project-tagline"
        style="font-size: 14px; line-height: 18px; color: #6B6560;"
      >
        {tagline}
      </span>
    </div>
    <!-- View toggle: Explorer / Kanban -->
    <div
      style="
        display: flex;
        border: 1px solid #333130;
        border-radius: 6px;
        overflow: hidden;
      "
    >
      <div style="padding: 6px 12px;">
        <span style="font-size: 13px; line-height: 16px; color: #6B6560;">Explorer</span>
      </div>
      <div style="padding: 6px 12px; background-color: #282624;">
        <span style="font-size: 13px; font-weight: 500; line-height: 16px; color: #EDE9E3;">Kanban</span>
      </div>
    </div>
  </div>

  <!-- Stats + filter row -->
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: baseline; gap: 24px;">
      <div style="display: flex; align-items: baseline; gap: 6px;">
        <span
          data-testid="milestone-count"
          style="
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 16px; font-weight: 700; line-height: 20px;
            color: #EDE9E3;
          "
        >{milestoneCount}</span>
        <span style="font-size: 12px; line-height: 16px; color: #A39E96;">milestone</span>
      </div>
      <div style="display: flex; align-items: baseline; gap: 6px;">
        <span
          data-testid="phase-count"
          style="
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 16px; font-weight: 700; line-height: 20px;
            color: #EDE9E3;
          "
        >{phaseCount}</span>
        <span style="font-size: 12px; line-height: 16px; color: #A39E96;">phase</span>
      </div>
      <div style="display: flex; align-items: baseline; gap: 6px;">
        <span
          data-testid="stream-count"
          style="
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 16px; font-weight: 700; line-height: 20px;
            color: #EDE9E3;
          "
        >{streamCount}</span>
        <span style="font-size: 12px; line-height: 16px; color: #A39E96;">streams</span>
      </div>
    </div>
  </div>
</div>
