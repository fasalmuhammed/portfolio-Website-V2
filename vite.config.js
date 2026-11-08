import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    // two pages: the professional site (the homepage) and the creative 3D world
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        creative: resolve(import.meta.dirname, 'creative.html'),
      },
    },
  },
})
