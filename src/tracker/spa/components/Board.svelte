<script lang="ts">
  import { onMount } from 'svelte'
  import { getProject, type TaskData } from '../lib/api.js'
  import { createTasksStore, type TasksStore } from '../stores/tasks.svelte.js'
  import { createSelectionStore, type SelectionStore } from '../stores/selection.svelte.js'
  import Header from './Header.svelte'
  import Filters from './Filters.svelte'
  import Column from './Column.svelte'

  interface Props {
    tasksStore?: TasksStore
    selectionStore?: SelectionStore
    projectName?: string
    projectTagline?: string
  }

  let {
    tasksStore: injectedTasksStore,
    selectionStore: injectedSelectionStore,
    projectName: initialProjectName,
    projectTagline: initialProjectTagline,
  }: Props = $props()

  const tasksStore = $derived(injectedTasksStore ?? createTasksStore())
  const selectionStore = $derived(injectedSelectionStore ?? createSelectionStore())

  let fetchedProject = $state<{ name: string; description: string } | null>(null)

  onMount(() => {
    tasksStore.start()
    if (initialProjectName === undefined) {
      void getProject().then((result) => {
        if (result.ok) {
          fetchedProject = {
            name: result.data.name ?? '—',
            description: result.data.description ?? '—',
          }
        }
      })
    }
    return () => {
      tasksStore.stop()
    }
  })

  const projectName = $derived(initialProjectName ?? fetchedProject?.name ?? '—')
  const projectTagline = $derived(initialProjectTagline ?? fetchedProject?.description ?? '—')

  const COLUMNS = [
    { id: 'todo', label: 'To Do', dot: '#6B6560' },
    { id: 'in-progress', label: 'In Progress', dot: '#F97316' },
    { id: 'in-review', label: 'In Review', dot: '#A78BFA' },
    { id: 'rework', label: 'Rework', dot: '#EC4899' },
    { id: 'done', label: 'Done', dot: '#22C55E' },
  ] as const

  function normalizeStatus(status?: string): string {
    if (!status) return 'todo'
    const s = status.toLowerCase().replace(/\s+/g, '-')
    if (s === 'to-do' || s === 'pending') return 'todo'
    if (s === 'in-progress' || s === 'progress') return 'in-progress'
    if (s === 'in-review' || s === 'review') return 'in-review'
    if (s === 'completed') return 'done'
    return s
  }

  const partitioned = $derived(
    tasksStore.tasks.reduce(
      (map, task) => {
        const col = normalizeStatus(task.status)
        map[col] = map[col] ?? []
        map[col].push(task)
        return map
      },
      { todo: [], 'in-progress': [], 'in-review': [], rework: [], done: [] } as Record<
        string,
        TaskData[]
      >
    )
  )

  function handleFilterChange(filter: { phase?: string; stream?: string }) {
    tasksStore.setFilter(filter)
  }

  function handleSelect(id: string) {
    selectionStore.select(id)
  }
</script>

<div style="flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
  <Header {projectName} {projectTagline} tasks={tasksStore.tasks} />

  <div
    style="
      flex-shrink: 0;
      height: 56px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      border-bottom: 1px solid #333130;
    "
  >
    <Filters tasks={tasksStore.tasks} onFilterChange={handleFilterChange} />
  </div>

  <div
    style="
      flex: 1 1 auto;
      display: flex;
      gap: 16px;
      padding: 16px 32px;
      overflow-x: auto;
      overflow-y: hidden;
    "
  >
    {#each COLUMNS as col}
      <Column
        column={col}
        tasks={partitioned[col.id] ?? []}
        onSelect={handleSelect}
      />
      <span data-testid="column-count-{col.id}" style="display: none;">
        {(partitioned[col.id] ?? []).length}
      </span>
    {/each}
  </div>
</div>
