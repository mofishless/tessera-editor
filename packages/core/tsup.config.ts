import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'node:fs'

/** Shared library build for framework-neutral packages. */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  external: [/@tiptap\/.*/, /prosemirror-.*/, /markdown-it/, 'vue'],
  onSuccess: () => {
    mkdirSync('dist', { recursive: true })
    copyFileSync('src/styles/tessera.css', 'dist/tessera.css')
  },
})
