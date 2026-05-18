import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig(async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte')
  const { svelteTesting } = await import('@testing-library/svelte/vite')
  const nodeModulesPath = resolve(process.cwd(), '../../node_modules')
  const setupFile = resolve(nodeModulesPath, '@testing-library/jest-dom/dist/vitest.mjs')
  return {
    plugins: [svelte(), svelteTesting()],
    resolve: {
      conditions: ['browser'],
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      setupFiles: [setupFile],
    },
    server: {
      fs: {
        allow: [nodeModulesPath],
      },
    },
  }
})
