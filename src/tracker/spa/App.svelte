<script lang="ts">
  /**
   * App.svelte — Root layout for the Blueprint Board SPA.
   * Design contract: 2YY-0 artboard (src/design/2YY-0.jsx).
   *
   * Layout: [Board panel (flex-1)] [TaskDetailRail (280px, collapsible)]
   * The rail is closed by default (data-open="false").
   * Column order matches P1 kanban statuses: To Do | In Progress | In Review | Rework | Done
   */

  const COLUMNS = [
    { id: 'todo',        label: 'To Do',       dot: '#6B6560' },
    { id: 'in-progress', label: 'In Progress', dot: '#F97316' },
    { id: 'in-review',   label: 'In Review',   dot: '#A78BFA' },
    { id: 'rework',      label: 'Rework',      dot: '#EC4899' },
    { id: 'done',        label: 'Done',        dot: '#22C55E' },
  ] as const

  let railOpen = $state(false)
</script>

<!--
  Root app shell.
  Board panel fills remaining width; rail slides in from the right.
  Tokens from src/design/computed-styles.json.
-->
<div
  class="app-root"
  style="
    display: flex;
    height: 100vh;
    overflow: hidden;
    background-color: #111110;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px;
    line-height: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #EDE9E3;
  "
>
  <!-- Board panel -->
  <div
    class="board-panel"
    style="
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    "
  >
    <!-- Header slot (populated by Board component in later streams) -->
    <div
      class="board-header"
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
            style="
              font-family: 'Space Grotesk', system-ui, sans-serif;
              font-size: 24px;
              font-weight: 700;
              line-height: 30px;
              color: #EDE9E3;
            "
          >
            blueprint-controls
          </span>
          <span style="font-size: 14px; line-height: 18px; color: #6B6560;">
            Operational source of truth for active projects
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
          {#each [['1','milestone'],['1','phase'],['6','streams']] as [n, label]}
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span
                style="
                  font-family: 'Space Grotesk', system-ui, sans-serif;
                  font-size: 16px; font-weight: 700; line-height: 20px;
                  color: #EDE9E3;
                "
              >{n}</span>
              <span style="font-size: 12px; line-height: 16px; color: #A39E96;">{label}</span>
            </div>
          {/each}
        </div>
        <!-- Phase + Stream filters -->
        <div style="display: flex; gap: 12px;">
          {#each [['Phase','All Phases'],['Stream','All Streams']] as [label, value]}
            <div
              style="
                display: flex; align-items: center; gap: 8px;
                padding: 6px 14px;
                border: 1px solid #333130; border-radius: 6px;
              "
            >
              <span style="font-size: 11px; line-height: 14px; color: #6B6560;">{label}</span>
              <span style="font-size: 13px; font-weight: 500; line-height: 16px; color: #EDE9E3;">{value}</span>
              <span style="font-size: 10px; line-height: 12px; color: #6B6560;">▾</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- 5-column board -->
    <div
      class="board-columns"
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
        <div
          data-column={col.id}
          style="
            flex: 1 1 0%;
            min-width: 180px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          "
        >
          <!-- Column header -->
          <div
            style="
              flex-shrink: 0;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            "
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span
                style="
                  flex-shrink: 0;
                  width: 8px; height: 8px;
                  border-radius: 50%;
                  background-color: {col.dot};
                  display: inline-block;
                "
              ></span>
              <span
                style="
                  font-family: 'Space Grotesk', system-ui, sans-serif;
                  font-size: 13px; font-weight: 600; line-height: 16px;
                  color: #EDE9E3;
                "
              >{col.label}</span>
            </div>
            <div
              style="
                background-color: #282624;
                border-radius: 4px;
                padding: 2px 8px;
              "
            >
              <span style="font-size: 14px; line-height: 18px; color: #A39E96;">0</span>
            </div>
          </div>
          <!-- Task card area (empty shell — populated in Stream A) -->
          <div
            class="column-body"
            style="
              flex: 1 1 auto;
              display: flex;
              flex-direction: column;
              gap: 6px;
            "
          ></div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Task Detail Rail -->
  <div
    data-rail
    data-open={String(railOpen)}
    style="
      flex-shrink: 0;
      width: {railOpen ? '280px' : '0'};
      overflow: hidden;
      transition: width 200ms ease;
      background-color: #151413;
      border-left: {railOpen ? '1px solid #333130' : 'none'};
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: {railOpen ? '20px' : '0'};
    "
  >
    <!-- Rail content populated by TaskDetailRail component in Stream B -->
    <div style="flex: 1 1 auto;"></div>
  </div>
</div>
