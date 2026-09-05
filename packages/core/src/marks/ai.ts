import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Attribution mark for AI-written content — the Slite-style "human vs Agent"
 * provenance signal. Lifecycle:
 *
 *   pending: true  → suggestion awaiting Accept / Reject (styled prominently)
 *   pending: false → accepted AI content (subtle permanent attribution)
 *
 * Reject deletes the marked range; Accept flips `pending` and stamps metadata.
 */
export interface AiAttributionOptions {
  HTMLAttributes: Record<string, unknown>
}

export const AiAttribution = Mark.create<AiAttributionOptions>({
  name: 'aiAttribution',

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      pending: {
        default: true,
        parseHTML: element => element.getAttribute('data-pending') !== 'false',
        renderHTML: attributes => ({ 'data-pending': String(attributes.pending) }),
      },
      action: {
        default: null,
        parseHTML: element => element.getAttribute('data-action'),
        renderHTML: attributes => (attributes.action ? { 'data-action': String(attributes.action) } : {}),
      },
      agent: {
        default: 'ai',
        parseHTML: element => element.getAttribute('data-agent') ?? 'ai',
        renderHTML: attributes => ({ 'data-agent': String(attributes.agent) }),
      },
      ts: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-ai]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-ai': '' }, this.options.HTMLAttributes, HTMLAttributes)]
  },
})
