import { Mark, mergeAttributes, Extension } from '@tiptap/core'

/**
 * Placeholder mark (v1.1, Slite's 占位符): dashed-underline token marking a
 * spot to fill in later — text / person / date / doc-link. ⌘⌥P toggles it on
 * a selection; slash items insert ready-made tokens.
 */
export type PlaceholderKind = 'text' | 'person' | 'date' | 'doc'

export const PlaceholderMark = Mark.create({
  name: 'tesseraPlaceholder',

  addAttributes() {
    return {
      kind: {
        default: 'text' as PlaceholderKind,
        parseHTML: element => (element.getAttribute('data-kind') as PlaceholderKind) ?? 'text',
        renderHTML: attributes => ({ 'data-kind': String(attributes.kind) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="tessera-placeholder"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'tessera-placeholder' }, HTMLAttributes)]
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tesseraPlaceholder: {
      togglePlaceholderMark: (kind?: PlaceholderKind) => ReturnType
      /** Insert a placeholder token at the caret (selection replaced). */
      insertPlaceholderToken: (kind: PlaceholderKind, label: string) => ReturnType
    }
  }
}

export const PlaceholderCommands = Extension.create({
  name: 'tesseraPlaceholderCommands',

  addCommands() {
    return {
      togglePlaceholderMark:
        (kind: PlaceholderKind = 'text') =>
        ({ commands }) =>
          commands.toggleMark('tesseraPlaceholder', { kind }),
      insertPlaceholderToken:
        (kind: PlaceholderKind, label: string) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: 'text',
              text: label,
              marks: [{ type: 'tesseraPlaceholder', attrs: { kind } }],
            })
            .run(),
    }
  },
})
