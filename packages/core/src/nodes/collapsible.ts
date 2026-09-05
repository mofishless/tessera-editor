import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface CollapsibleOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collapsible: {
      /** Replace the current empty paragraph with a collapsible block (input rule: `>>` + space). */
      insertCollapsible: () => ReturnType
    }
  }
}

function collapsibleJSON(): Record<string, unknown> {
  return {
    type: 'collapsible',
    attrs: { open: true },
    content: [
      { type: 'collapsibleSummary' },
      {
        type: 'collapsibleContent',
        content: [{ type: 'paragraph' }],
      },
    ],
  }
}

/**
 * Slite-style Collapsible block: always-visible summary line + collapsible content,
 * nested blocks allowed. Trigger: type `>>` followed by a space on an empty line.
 */
export const Collapsible = Node.create<CollapsibleOptions>({
  name: 'collapsible',
  group: 'block',
  content: 'collapsibleSummary collapsibleContent',
  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => element.getAttribute('data-open') !== 'false',
        renderHTML: attributes => ({ 'data-open': String(attributes.open) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'collapsible' }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertCollapsible: () => ({ state, chain }) => {
        const { $from } = state.selection
        if ($from.parent.type.name !== 'paragraph') {
          return false
        }
        const from = $from.before()
        const to = $from.after()
        return chain()
          .insertContentAt({ from, to }, collapsibleJSON())
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)))
            }
            return true
          })
          .run()
      },
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^(>{2}) $/,
        handler: ({ state, range, chain }) => {
          const $from = state.doc.resolve(range.from)
          if ($from.parent.type.name !== 'paragraph') {
            return
          }
          const from = $from.before()
          const to = $from.after()
          chain()
            .insertContentAt({ from, to }, collapsibleJSON())
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)))
              }
              return true
            })
            .run()
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    const nodeName = this.name
    return [
      new Plugin({
        key: new PluginKey('tesseraCollapsibleToggle'),
        props: {
          // Click on the summary toggles open/closed; collapsed state survives reload
          // because it is a node attribute, not CSS state.
          handleClickOn: (view, _pos, node, nodePos, event) => {
            if (node.type.name !== nodeName) {
              return false
            }
            const target = event.target as HTMLElement | null
            if (!target?.closest('[data-type="collapsible-summary"]')) {
              return false
            }
            view.dispatch(
              view.state.tr.setNodeMarkup(nodePos, undefined, {
                ...node.attrs,
                open: !node.attrs.open,
              }),
            )
            return true
          },
        },
      }),
    ]
  },
})

export const CollapsibleSummary = Node.create({
  name: 'collapsibleSummary',
  group: '',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-summary"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'collapsible-summary' }, HTMLAttributes), 0]
  },
})

export const CollapsibleContent = Node.create({
  name: 'collapsibleContent',
  group: '',
  content: 'block+',

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-content"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'collapsible-content' }, HTMLAttributes), 0]
  },
})
