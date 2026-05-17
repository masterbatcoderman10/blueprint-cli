/**
 * src/tracker/spa/main.ts
 * Svelte 5 SPA entry point — mounts App.svelte into #app.
 */

import { mount } from 'svelte'
import App from './App.svelte'

const target = document.getElementById('app')
if (!target) {
  throw new Error('Blueprint Board: #app element not found in document.')
}

mount(App, { target })
