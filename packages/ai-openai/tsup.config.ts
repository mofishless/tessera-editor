import { defineConfig } from 'tsup'

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
})
