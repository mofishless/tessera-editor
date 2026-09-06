import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { docToMarkdown } from '../markdown'

/**
 * Performance metrics (acceptance §8, v1.1): long-document observability.
 * The architecture keeps per-block NodeViews and lazy decoration passes in
 * place; this exposes the numbers a host needs to watch (block/word counts,
 * heavy-node counts, markdown serialize cost) so virtualization work can be
 * measured rather than guessed. Usage: `getTesseraMetrics(editor)`.
 */

export interface TesseraMetricsSnapshot {
  /** Top-level blocks in the document. */
  blocks: number
  /** Whitespace-split word count of the document text. */
  words: number
  /** imageBlock nodes. */
  images: number
  /** aiTable nodes. */
  tables: number
  /** NodeView wrapper elements currently mounted. */
  mountedNodeViews: number
  /** Milliseconds for a full Markdown serialization of the current doc. */
  serializeMs: number
}

export function measureTesseraMetrics(editor: Editor): TesseraMetricsSnapshot {
  let images = 0
  let tables = 0
  editor.state.doc.descendants(node => {
    if (node.type.name === 'imageBlock') images += 1
    if (node.type.name === 'table') tables += 1
    return true
  })

  const started = performance.now()
  docToMarkdown(editor.state.doc, editor.state.schema)
  const serializeMs = Math.round((performance.now() - started) * 100) / 100

  return {
    blocks: editor.state.doc.childCount,
    words: editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ', ' ')
      .split(/\s+/)
      .filter(Boolean).length,
    images,
    tables,
    mountedNodeViews: editor.view
      ? editor.view.dom.querySelectorAll('[data-node-view-wrapper]').length
      : 0,
    serializeMs,
  }
}

export const TesseraMetrics = Extension.create({
  name: 'tesseraMetrics',
})

export function getTesseraMetrics(editor: Editor): TesseraMetricsSnapshot {
  return measureTesseraMetrics(editor)
}
