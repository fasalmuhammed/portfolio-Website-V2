import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    // two pages: the creative 3D world and the professional site
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        pro: resolve(import.meta.dirname, 'pro.html'),
      },
    },
  },
})
