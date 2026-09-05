import { Mark, Extension, mergeAttributes } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

/**
 * Inline comment mark (v1.1): anchors a comment thread to a text range.
 * Thread data lives in the injected CommentStore; the mark only carries the
 * thread id + resolved state so the doc stays host-persistable.
 */
export const CommentMark = Mark.create({
  name: 'comment',

  inclusive: false,

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: element => element.getAttribute('data-thread-id'),
        renderHTML: attributes => ({ 'data-thread-id': String(attributes.threadId ?? '') }),
      },
      resolved: {
        default: false,
        parseHTML: element => element.getAttribute('data-resolved') === 'true',
        renderHTML: attributes => ({ 'data-resolved': String(attributes.resolved) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-thread-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-comment': '' }, HTMLAttributes)]
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tesseraComment: {
      /** Attach a comment thread id to the current selection. */
      addCommentThread: (threadId: string) => ReturnType
      /** Flip resolved for every mark of `threadId`. */
      setCommentResolved: (threadId: string, resolved: boolean) => ReturnType
      /** Remove all marks of `threadId` (thread deleted). */
      removeCommentThread: (threadId: string) => ReturnType
      /** Select the next comment range from the caret (wraps around). */
      focusNextCommentThread: () => ReturnType
    }
  }
}

/** All comment thread ranges in document order. */
export function listCommentRanges(state: import('@tiptap/pm/state').EditorState): { threadId: string; from: number; to: number; resolved: boolean }[] {
  const seen = new Map<string, { threadId: string; from: number; to: number; resolved: boolean }>()
  state.doc.descendants((node, pos) => {
    for (const m of node.marks) {
      if (m.type.name === 'comment' && typeof m.attrs.threadId === 'string') {
        const from = pos
        const to = pos + node.nodeSize
        const existing = seen.get(m.attrs.threadId)
        if (!existing) {
          seen.set(m.attrs.threadId, { threadId: m.attrs.threadId, from, to, resolved: Boolean(m.attrs.resolved) })
        } else {
          existing.to = Math.max(existing.to, to)
          existing.resolved = existing.resolved && Boolean(m.attrs.resolved)
        }
      }
    }
    return true
  })
  return [...seen.values()].sort((a, b) => a.from - b.from)
}

export const CommentCommands = Extension.create({
  name: 'tesseraCommentCommands',

  addCommands() {
    return {
      addCommentThread:
        (threadId: string) =>
        ({ commands }) =>
          commands.setMark('comment', { threadId, resolved: false }),
      setCommentResolved:
        (threadId: string, resolved: boolean) =>
        ({ state, tr, dispatch }) => {
          let touched = false
          state.doc.descendants((node, pos) => {
            node.marks
              .filter(m => m.type.name === 'comment' && m.attrs.threadId === threadId)
              .forEach(m => {
                const next = state.schema.marks.comment!.create({ ...m.attrs, resolved })
                tr.removeMark(pos, pos + node.nodeSize, m)
                tr.addMark(pos, pos + node.nodeSize, next)
                touched = true
              })
            return true
          })
          if (touched && dispatch) {
            dispatch(tr)
          }
          return touched
        },
      removeCommentThread:
        (threadId: string) =>
        ({ state, tr, dispatch }) => {
          let touched = false
          state.doc.descendants((node, pos) => {
            if (node.marks.some(m => m.type.name === 'comment' && m.attrs.threadId === threadId)) {
              tr.removeMark(pos, pos + node.nodeSize, state.schema.marks.comment!)
              touched = true
            }
            return true
          })
          if (touched && dispatch) {
            dispatch(tr)
          }
          return touched
        },
      focusNextCommentThread:
        () =>
        ({ state, tr, dispatch }) => {
          const ranges = listCommentRanges(state)
          if (ranges.length === 0) {
            return false
          }
          const anchor = state.selection.from
          const next = ranges.find(r => r.from > anchor) ?? ranges[0]!
          if (dispatch) {
            tr.setSelection(TextSelection.create(state.doc, next.from, next.to))
            dispatch(tr)
          }
          return true
        },
    }
  },
})
