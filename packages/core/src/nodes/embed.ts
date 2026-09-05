import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Sandboxed iframe embed (v1.1): default sandbox="" — NO scripts, NO
 * same-origin. Hosts may opt into `allowScripts` per instance for app-like
 * embeds; allow-same-origin is never combined with allow-scripts.
 */
export const EmbedBlock = Node.create({
  name: 'embedBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      height: { default: 360 },
      allowScripts: { default: false },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tessera-embed"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'tessera-embed',
        'data-src': String(node.attrs.src ?? ''),
        'data-height': String(node.attrs.height),
        'data-allow-scripts': String(node.attrs.allowScripts),
      }),
    ]
  },

  addCommands() {
    return {
      insertEmbed:
        (attrs: { src: string; height?: number; allowScripts?: boolean }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embedBlock: {
      insertEmbed: (attrs: { src: string; height?: number; allowScripts?: boolean }) => ReturnType
    }
  }
}
