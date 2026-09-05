import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Table-of-contents block (v1.1, Slite /outline): renders the document
 * outline (H1–H4) with anchor jumps. The list itself is derived state — the
 * node stores nothing, so it can never go stale in the canonical JSON.
 */
export const TocBlock = Node.create({
  name: 'tocBlock',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="tessera-toc"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tessera-toc' })]
  },

  addCommands() {
    return {
      insertToc:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tocBlock: {
      insertToc: () => ReturnType
    }
  }
}
