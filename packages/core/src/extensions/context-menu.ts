import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

/**
 * Block context menu (v1.1): right-click a block → `tessera:blockMenu` event.
 * The binding renders the menu (copy anchor link / copy block id / delete;
 * row & column ops when the target is a table).
 */
export const BlockContextMenu = Extension.create({
  name: 'tesseraBlockMenu',

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
          contextmenu: (view, event) => {
            // read-only docs keep the native context menu (copy link, …) —
            // the Tessera menu's actions would mutate a frozen document
            if (!editor.isEditable) {
              return false
            }
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (!coords) {
                return false
              }
              const $pos = view.state.doc.resolve(coords.pos)
              for (let depth = $pos.depth; depth >= 1; depth--) {
                const node = $pos.node(depth)
                if (typeof node.attrs.id === 'string') {
                  editor.emit('tessera:blockMenu', {
                    blockId: node.attrs.id as string,
                    blockType: node.type.name,
                    clientX: event.clientX,
                    clientY: event.clientY,
                  })
                  event.preventDefault()
                  return true
                }
              }
              return false
            },
          },
        },
      }),
    ]
  },
})

declare module '@tiptap/core' {
  interface EditorEvents {
    'tessera:blockMenu': {
      blockId: string
      blockType: string
      clientX: number
      clientY: number
    }
  }
}
