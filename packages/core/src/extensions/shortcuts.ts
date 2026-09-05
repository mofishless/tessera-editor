import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

/**
 * The Tessera keyboard map (acceptance checklist §3). Panel-opening shortcuts
 * emit `tessera:*` events that the binding's UI layer listens to, keeping this
 * extension UI-free.
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tesseraShortcuts: {
      /** Move the top-level block containing the caret up one position. */
      moveBlockUp: () => ReturnType
      /** Move the top-level block containing the caret down one position. */
      moveBlockDown: () => ReturnType
    }
  }
  interface EditorEvents {
    'tessera:formatPanel': { kind: 'color' | 'highlight' }
    'tessera:linkPanel': Record<string, never>
    'tessera:findPanel': Record<string, never>
    'tessera:insertImage': Record<string, never>
    'tessera:askPanel': Record<string, never>
    'tessera:historyPanel': Record<string, never>
    'tessera:commentPanel': Record<string, never>
  }
}

export const TesseraShortcuts = Extension.create({
  name: 'tesseraShortcuts',
  priority: 500,

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ state, tr, dispatch }) =>
          swapBlock(state, tr, dispatch, -1),
      moveBlockDown:
        () =>
        ({ state, tr, dispatch }) =>
          swapBlock(state, tr, dispatch, 1),
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-Shift-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-Shift-3': () => this.editor.commands.toggleHeading({ level: 3 }),
      'Mod-Shift-4': () => this.editor.commands.toggleHeading({ level: 4 }),
      'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
      'Mod-Shift-c': () => this.editor.commands.toggleTaskList(),
      'Mod-Alt-h': () => this.editor.commands.toggleHint(),
      'Mod-j': () => this.editor.commands.toggleCode(),
      'Mod-Shift-9': () => this.editor.commands.toggleCodeBlock(),
      'Mod-Shift-.': () => this.editor.commands.toggleBlockquote(),
      'Mod-e': () => {
        this.editor.emit('tessera:formatPanel', { kind: 'color' })
        return true
      },
      'Mod-k': () => {
        this.editor.emit('tessera:linkPanel', {})
        return true
      },
      'Mod-f': () => {
        this.editor.emit('tessera:findPanel', {})
        return true
      },
      'Mod-Shift-k': () => {
        this.editor.emit('tessera:askPanel', {})
        return true
      },
      'Mod-Alt-s': () => this.editor.commands.insertTableTyped({ withHeaderRow: true }),
      'Mod-Alt-t': () => this.editor.commands.insertTableTyped({ withHeaderRow: false }),
      'Mod-Alt-p': () => this.editor.commands.togglePlaceholderMark('text'),
      'Mod-Alt-m': () => {
        this.editor.emit('tessera:commentPanel', {})
        return true
      },
      'Alt-ArrowUp': () => this.editor.commands.moveBlockUp(),
      'Alt-ArrowDown': () => this.editor.commands.moveBlockDown(),
    }
  },
})

type Dispatch = ((args?: unknown) => void) | undefined

function swapBlock(state: EditorState, tr: Transaction, dispatch: Dispatch, direction: -1 | 1): boolean {
  const { $from } = state.selection
  if ($from.depth < 1) {
    return false
  }
  const index = $from.index(0)
  const other = index + direction
  if (other < 0 || other >= state.doc.childCount) {
    return false
  }
  const node = state.doc.child(index)
  const otherNode = state.doc.child(other)
  const pos = $from.before(1)
  const nodeStart = direction === -1 ? pos - otherNode.nodeSize : pos
  const rangeEnd = nodeStart + otherNode.nodeSize + node.nodeSize
  if (dispatch) {
    const content = direction === -1 ? [node, otherNode] : [otherNode, node]
    tr.replaceWith(nodeStart, rangeEnd, content)
    const anchor = tr.mapping.map(state.selection.anchor)
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(anchor, tr.doc.content.size))))
    dispatch(tr)
  }
  return true
}

export type { Editor }
