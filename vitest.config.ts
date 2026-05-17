import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  const { svelteTesting } = await import('@testing-library/svelte/vite')
  return {
    plugins: [svelte(), svelteTesting()],
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      setupFiles: ['./node_modules/@testing-library/jest-dom/vitest.js'],
    },
  }
})
