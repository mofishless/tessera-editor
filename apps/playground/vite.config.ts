import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // specific aliases MUST precede the package-prefix aliases
      '@tessera-editor/core/styles.css': path.resolve(here, '../../packages/core/src/styles/tessera.css'),
      '@tessera-editor/react/styles.css': path.resolve(here, '../../packages/core/src/styles/tessera.css'),
      '@tessera-editor/core': path.resolve(here, '../../packages/core/src/index.ts'),
      '@tessera-editor/react': path.resolve(here, '../../packages/react/src/index.ts'),
      '@tessera-editor/ai': path.resolve(here, '../../packages/ai/src/index.ts'),
      '@tessera-editor/ai-openai': path.resolve(here, '../../packages/ai-openai/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
