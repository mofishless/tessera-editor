import { getMarkRange } from '@tiptap/core'
import type { Editor } from '@tiptap/core'

/**
 * Link click-to-edit: clicking a link opens a panel with its display text
 * and href, and offers unlink (degrade to plain text). The doc semantics
 * live here so React and Vue bindings behave identically.
 */

export interface TesseraLinkRange {
  from: number
  to: number
  text: string
  href: string
}

/** Resolve the link mark range under/ending at `pos` (defaults to the caret). */
export function findLinkRange(editor: Editor, pos?: number): TesseraLinkRange | null {
  const { doc, schema } = editor.state
  const at = pos ?? editor.state.selection.from
  const linkType = schema.marks.link
  // a caret sitting exactly at the link's last position only sees the mark
  // one position earlier, hence the at-1 fallback
  for (const p of [at, Math.max(0, at - 1)]) {
    const range = getMarkRange(doc.resolve(p), linkType)
    if (!range) continue
    const node = doc.nodeAt(range.from)
    const href = (node?.marks.find(m => m.type === linkType)?.attrs.href as string | undefined) ?? ''
    return {
      from: range.from,
      to: range.to,
      text: doc.textBetween(range.from, range.to, '\n'),
      href,
    }
  }
  return null
}

/**
 * Save an edit in ONE transaction (single undo step): update href, and when
 * the display text changed replace the range content while keeping the
 * text's other marks. An empty href degrades to unlink.
 */
export function saveLinkRange(editor: Editor, range: TesseraLinkRange, next: { text: string; href: string }): void {
  const { schema, tr, doc } = editor.state
  const linkType = schema.marks.link
  if (!next.href.trim()) {
    removeLinkRange(editor, range)
    return
  }
  const linkMark = linkType.create({ href: next.href.trim() })
  if (next.text !== range.text) {
    const first = doc.nodeAt(range.from)
    const otherMarks = (first?.marks ?? []).filter(m => m.type !== linkType)
    tr.replaceWith(range.from, range.to, schema.text(next.text, [...otherMarks, linkMark]))
  } else {
    tr.removeMark(range.from, range.to, linkType).addMark(range.from, range.to, linkMark)
  }
  editor.view.dispatch(tr)
}

/** Strip the link mark, keeping the display text as plain text. */
export function removeLinkRange(editor: Editor, range: TesseraLinkRange): void {
  const tr = editor.state.tr.removeMark(range.from, range.to, editor.state.schema.marks.link)
  editor.view.dispatch(tr)
}
