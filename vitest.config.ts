import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  return {
    plugins: [svelte()],
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  }
})
