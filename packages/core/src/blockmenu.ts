import type { Editor } from '@tiptap/core'

/**
 * Block menu helpers shared by the right-click context menu and the drag
 * handle menu (acceptance §5). Pure functions so both bindings — and the
 * tests — operate on the same logic.
 */

/** Resolves the document position of a top-level block by its stable id. */
export function findBlockPosById(editor: Editor, id: string): number | null {
  let found: number | null = null
  editor.state.doc.forEach((node, offset) => {
    if (found === null && node.attrs.id === id) {
      found = offset
    }
  })
  return found
}

/** Removes a top-level block by its stable id (single transaction). */
export function deleteBlockById(editor: Editor, id: string): boolean {
  const pos = findBlockPosById(editor, id)
  if (pos === null) {
    return false
  }
  const node = editor.state.doc.nodeAt(pos)
  if (!node) {
    return false
  }
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
  return true
}

/** Anchor URL for a block id (`#block-<id>` on the current page). */
export function blockAnchorUrl(blockId: string): string {
  return `${location.origin}${location.pathname}#block-${blockId}`
}
