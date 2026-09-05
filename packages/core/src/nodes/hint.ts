import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core'

export type HintVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface HintOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    hint: {
      /** Wrap the current block into a hint container (input rule: `!! ` + space). */
      setHint: (variant?: HintVariant) => ReturnType
      toggleHint: () => ReturnType
    }
  }
}

/**
 * Slite-style Hint block: a callout container that holds any block content.
 * Trigger: type `!!` followed by a space at the start of a line.
 */
export const Hint = Node.create<HintOptions>({
  name: 'hint',
  group: 'block',
  content: 'block+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      variant: {
        default: 'info' as HintVariant,
        parseHTML: element => (element.getAttribute('data-variant') as HintVariant) || 'info',
        renderHTML: attributes => ({ 'data-variant': String(attributes.variant) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="hint"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'hint' }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setHint: (variant: HintVariant = 'info') => ({ commands }) => commands.wrapIn(this.name, { variant }),
      toggleHint: () => ({ commands }) => commands.toggleWrap(this.name),
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: /^(!{2}) $/,
        type: this.type,
        keepMarks: true,
        keepAttributes: true,
      }),
    ]
  },
})
