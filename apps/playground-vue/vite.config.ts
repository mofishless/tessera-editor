import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // specific aliases MUST precede the package-prefix aliases
      '@tessera-editor/core/styles.css': path.resolve(here, '../../packages/core/src/styles/tessera.css'),
      '@tessera-editor/core': path.resolve(here, '../../packages/core/src/index.ts'),
      '@tessera-editor/ai': path.resolve(here, '../../packages/ai/src/index.ts'),
      '@tessera-editor/vue': path.resolve(here, '../../packages/vue/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
