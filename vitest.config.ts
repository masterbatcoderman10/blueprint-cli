import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  const { svelteTesting } = await import('@testing-library/svelte/vite')
  return {
    plugins: [svelte(), svelteTesting({ autoCleanup: false })],
    resolve: {
      conditions: ['browser'],
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      setupFiles: ['./tests/setup/vitest.setup.ts'],
    },
  }
})
