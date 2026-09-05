import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: path.resolve(here, 'tsconfig.json'), rollupTypes: true, clean: true }),
  ],
  build: {
    lib: {
      entry: path.resolve(here, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [/@tiptap\/.*/, /prosemirror-.*/, 'vue', /@tessera\/.*/],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
