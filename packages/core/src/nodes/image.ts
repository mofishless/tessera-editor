import { Node, mergeAttributes } from '@tiptap/core'

export type ImageAlign = 'left' | 'center' | 'full'

export interface ImageBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImage: (options: {
        src: string
        alt?: string
        title?: string
        width?: number
        align?: ImageAlign
      }) => ReturnType
    }
  }
}

/**
 * Block-level image with width + alignment attributes. Binary data goes
 * through the injected UploadService; this node only stores the resulting URL.
 */
export const ImageBlock = Node.create<ImageBlockOptions>({
  name: 'imageBlock',
  inline: false,
  group: 'block',
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      align: { default: 'center' as ImageAlign },
    }
  },

  parseHTML() {
    return [
      { tag: 'img[data-type="tessera-image"]' },
      // plain <img> pasted from outside becomes a block image
      { tag: 'img[src]:not([data-type])' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = node.attrs.width ? `width: ${Number(node.attrs.width)}px` : undefined
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'tessera-image',
        'data-align': String(node.attrs.align),
        style,
      }),
    ]
  },

  addCommands() {
    return {
      setImage:
        options =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})
