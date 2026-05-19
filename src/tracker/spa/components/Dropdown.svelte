<script lang="ts">
  interface Props {
    label: string
    value: string
    options: string[]
    placeholder?: string
    onChange: (value: string) => void
  }

  let { label, value, options, placeholder = 'All', onChange }: Props = $props()

  let open = $state(false)
  let containerEl: HTMLDivElement | undefined = $state()

  function toggle() {
    open = !open
  }

  function select(opt: string) {
    onChange(opt)
    open = false
  }

  function handleWindowClick(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false
    }
  }

  const displayValue = $derived(value || placeholder)
</script>

<svelte:window onclick={handleWindowClick} />

<div bind:this={containerEl} style="position: relative;">
  <button
    type="button"
    onclick={toggle}
    style="
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border: 1px solid {open ? '#6B6560' : '#333130'}; border-radius: 6px;
      background: transparent;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    "
  >
    <span style="font-size: 11px; line-height: 14px; color: #6B6560;">{label}</span>
    <span
      style="
        font-size: 13px; font-weight: 500; line-height: 16px;
        color: #EDE9E3;
        font-family: 'DM Sans', system-ui, sans-serif;
      "
    >{displayValue}</span>
    <span style="font-size: 10px; line-height: 12px; color: #6B6560;">▾</span>
  </button>

  {#if open}
    <div
      style="
        position: absolute; right: 0; top: calc(100% + 4px); z-index: 200;
        min-width: 180px;
        background: #1C1A18;
        border: 1px solid #333130; border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        overflow: hidden;
      "
    >
      <button
        type="button"
        onclick={() => select('')}
        style="
          display: block; width: 100%;
          padding: 8px 14px; text-align: left;
          background: {value === '' ? '#282624' : 'transparent'};
          border: none; cursor: pointer;
          font-size: 13px; font-weight: 500; line-height: 16px;
          color: {value === '' ? '#EDE9E3' : '#A39E96'};
          font-family: 'DM Sans', system-ui, sans-serif;
        "
      >{placeholder}</button>
      {#each options as opt}
        <button
          type="button"
          onclick={() => select(opt)}
          style="
            display: block; width: 100%;
            padding: 8px 14px; text-align: left;
            background: {value === opt ? '#282624' : 'transparent'};
            border: none; cursor: pointer;
            font-size: 13px; font-weight: 500; line-height: 16px;
            color: {value === opt ? '#EDE9E3' : '#A39E96'};
            font-family: 'DM Sans', system-ui, sans-serif;
          "
        >{opt}</button>
      {/each}
    </div>
  {/if}
</div>
