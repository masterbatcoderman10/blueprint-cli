import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  return {
    plugins: [svelte()],
    resolve: {
      conditions: ['browser'],
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  }
})
